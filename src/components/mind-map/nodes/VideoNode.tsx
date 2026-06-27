"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useReactFlow,
} from "@xyflow/react";
import {
  AlertCircle,
  CheckCircle2,
  Film,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";
import { pickHandles } from "@/utils/mind-map-handles";
import {
  distributeBesideHub,
  type Rect,
  rectOf,
} from "@/utils/mind-map-layout";
import {
  analyzeVideoMindmap,
  isTikTokUrl,
  type VideoMindmapResult,
} from "@/utils/video-mindmap-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoStatus = "idle" | "analyzing" | "done" | "error";

export type VideoDropData = {
  status: VideoStatus;
  tiktokUrl?: string;
  userPrompt?: string;
  note?: string;
  resultCount?: number;
};

export type VideoDropNodeType = Node<VideoDropData, "videoDrop">;

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

// ── Video analysis category → content node category mapping ──────────────────
// bigPicture + targetAudience → script (concept-level)
// composition → visual (how it's shot)
// toneAndMood → audio (feel / music choice)

type ResultListKey = keyof Pick<
  VideoMindmapResult,
  "bigPicture" | "toneAndMood" | "targetAudience" | "composition"
>;

const VIDEO_TO_CONTENT: Record<
  ResultListKey,
  { category: ContentNodeData["category"]; header: string }
> = {
  bigPicture:     { category: "script", header: "Big Picture" },
  targetAudience: { category: "script", header: "Target Audience" },
  composition:    { category: "visual", header: "Composition" },
  toneAndMood:    { category: "audio",  header: "Tone & Mood" },
};

function truncate(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoNode({
  id,
  data,
  selected,
}: NodeProps<VideoDropNodeType>) {
  const { updateNodeData, getNode, getNodes, addNodes, addEdges } =
    useReactFlow();

  const status = data.status ?? "idle";
  const [url, setUrl] = useState(data.tiktokUrl ?? "");
  const [prompt, setPrompt] = useState(data.userPrompt ?? "");

  // Spawn analysis results as themed content nodes linked back to this video node.
  // De-dupes against nodes already spawned from this video block.
  const spawnResults = useCallback(
    (result: VideoMindmapResult): number => {
      const self = getNode(id);
      if (!self) return 0;

      const leafW = 220;
      const leafH = 70;
      const leafBox = (pos: { x: number; y: number }) => ({
        position: pos,
        width: leafW,
        height: leafH,
      });

      const occupied: Rect[] = getNodes().map(rectOf);

      // Labels already attached to this block, for dedupe.
      const seen = new Set<string>();
      for (const n of getNodes()) {
        if (n.id.startsWith(`vid-${id}-`)) {
          const d = n.data as ContentNodeData;
          seen.add(`${d.header}::${d.body}`);
        }
      }

      let spawned = 0;
      for (const [key, mapping] of Object.entries(VIDEO_TO_CONTENT) as [
        ResultListKey,
        { category: ContentNodeData["category"]; header: string },
      ][]) {
        const items: string[] = (result[key] ?? [])
          .map((raw: string) => truncate(raw))
          .filter(
            (label: string) => label && !seen.has(`${mapping.header}::${label}`),
          );
        if (items.length === 0) continue;

        const positions = distributeBesideHub(self, items.length, occupied, {
          dir: 1,
          leafW,
          leafH,
        });

        items.forEach((body: string, i: number) => {
          const pos = positions[i];
          const nodeId = `vid-${id}-${Date.now()}-${spawned}`;

          const nodeData: ContentNodeData = {
            category: mapping.category,
            header: mapping.header,
            body,
            fontSize: 14,
          };

          addNodes({
            id: nodeId,
            type: "content",
            position: pos,
            data: nodeData,
          });

          const handles = pickHandles(self, leafBox(pos));
          addEdges({
            id: `e-vid-${nodeId}`,
            source: id,
            target: nodeId,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            type: "labeled",
            data: { arrowEnd: true },
            markerEnd: EDGE_MARKER,
          });

          seen.add(`${mapping.header}::${body}`);
          spawned += 1;
        });

        // Grow the occupied map after each batch so next category positions don't overlap
        for (const p of positions) {
          occupied.push({ x: p.x, y: p.y, w: leafW, h: leafH });
        }
      }
      return spawned;
    },
    [id, getNode, getNodes, addNodes, addEdges],
  );

  const handleAnalyze = useCallback(async () => {
    const tiktokUrl = url.trim();
    const userPrompt = prompt.trim();
    if (!isTikTokUrl(tiktokUrl)) {
      updateNodeData(id, {
        status: "error",
        note: "Enter a valid TikTok video link.",
        tiktokUrl,
        userPrompt,
      });
      return;
    }
    if (!userPrompt) {
      updateNodeData(id, {
        status: "error",
        note: "Add a prompt describing what to extract.",
        tiktokUrl,
        userPrompt,
      });
      return;
    }

    updateNodeData(id, { status: "analyzing", tiktokUrl, userPrompt });
    try {
      const result = await analyzeVideoMindmap(id, tiktokUrl, userPrompt);
      const count = spawnResults(result);
      updateNodeData(id, {
        status: "done",
        note:
          count > 0
            ? `Added ${count} idea${count === 1 ? "" : "s"} from this video.`
            : "These ideas are already on your canvas.",
        resultCount: count,
      });
    } catch (err) {
      updateNodeData(id, {
        status: "error",
        note: err instanceof Error ? err.message : "Analysis failed.",
      });
    }
  }, [id, url, prompt, updateNodeData, spawnResults]);

  const analyzing = status === "analyzing";

  return (
    <div className="group relative w-70">
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map(
        (pos) => (
          <>
            <Handle
              key={`s-${pos}`}
              type="source"
              id={pos}
              position={pos}
              className={HANDLE_CLS}
            />
            <Handle
              key={`t-${pos}`}
              type="target"
              id={pos}
              position={pos}
              className={HANDLE_CLS}
            />
          </>
        ),
      )}

      {/* Teal sidebar palette */}
      <div
        className={[
          "rounded-2xl p-4 shadow-sm transition-shadow",
          selected ? "ring-2 ring-[#0f766e]" : "",
        ].join(" ")}
        style={{ backgroundColor: "#e4f2eb" }}
      >
        <div
          className="flex items-center gap-1.5 mb-3"
          style={{ color: "#0f766e" }}
        >
          <Film size={14} />
          <span className="text-sm font-bold">Analyse a video</span>
        </div>

        <div className="nodrag nopan flex flex-col gap-2.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => updateNodeData(id, { tiktokUrl: url.trim() })}
            disabled={analyzing}
            placeholder="Paste a TikTok share link…"
            className="w-full rounded-xl border border-[#4caf87]/40 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#0f766e] disabled:opacity-60"
          />

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => updateNodeData(id, { userPrompt: prompt })}
            disabled={analyzing}
            rows={4}
            placeholder="What should we pull from this video? e.g. hook ideas, tone, shot list…"
            className="w-full resize-none rounded-xl border border-[#4caf87]/40 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#0f766e] disabled:opacity-60"
          />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-70"
            style={{ backgroundColor: "#2e7d5a" }}
          >
            {analyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analysing…
              </>
            ) : status === "error" ? (
              <>
                <Sparkles size={14} />
                Retry
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analyse video
              </>
            )}
          </button>

          {status === "done" && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-emerald-700">
              <CheckCircle2 size={13} className="mt-px shrink-0" />
              {data.note}
            </p>
          )}
          {status === "error" && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-red-500">
              <AlertCircle size={13} className="mt-px shrink-0" />
              {data.note ?? "Something went wrong."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
