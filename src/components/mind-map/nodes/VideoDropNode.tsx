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
import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";
import { leafNodeStyle } from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
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
  // Persisted form inputs — captured by the canvas autosave (saveCanvas stores
  // node.data) so a reload restores what the user typed.
  tiktokUrl?: string;
  userPrompt?: string;
  note?: string;
  resultCount?: number;
};

export type VideoDropNodeType = Node<VideoDropData, "videoDrop">;

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

// The string[] result fields (excludes nodeId) — each is one category of ideas.
type ResultListKey =
  | "bigPicture"
  | "toneAndMood"
  | "targetAudience"
  | "composition";

// Category → leaf colour. Independent of the canvas hubs: video-analysis leaves
// attach only to their own video block, never to a hub, so they don't need a hub
// to exist (and won't connect to anything else on the canvas).
const VIDEO_CATEGORIES: {
  key: ResultListKey;
  leafBg: string;
  leafText: string;
}[] = [
  { key: "bigPicture", leafBg: "#fbe0e1", leafText: "#d6494e" },
  { key: "composition", leafBg: "#e3ecfb", leafText: "#3b6fd4" },
  { key: "toneAndMood", leafBg: "#ededed", leafText: "#4b5563" },
  { key: "targetAudience", leafBg: "#fbeec6", leafText: "#b08400" },
];

function truncate(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoDropNode({
  id,
  data,
  selected,
}: NodeProps<VideoDropNodeType>) {
  const { updateNodeData, getNode, getNodes, addNodes, addEdges } =
    useReactFlow();

  const status = data.status ?? "idle";
  const [url, setUrl] = useState(data.tiktokUrl ?? "");
  const [prompt, setPrompt] = useState(data.userPrompt ?? "");

  // Spawn each analysis result as a leaf with a SINGLE edge back to this video
  // block (provenance) — never to a hub or any other node. Leaves are laid out
  // in evenly spaced, collision-free columns beside the video block itself
  // (distributeBesideHub anchored on `self`). De-duped against leaves already on
  // this block so re-runs / cache hits don't pile up.
  const spawnResults = useCallback(
    (result: VideoMindmapResult): number => {
      const self = getNode(id);
      if (!self) return 0;

      const leafW = 210;
      const leafH = 40;
      const leafBox = (pos: { x: number; y: number }) => ({
        position: pos,
        width: leafW,
        height: leafH,
      });

      // Live occupancy map — seeded from every current node, grown as we place.
      const occupied: Rect[] = getNodes().map(rectOf);
      // Labels already attached to this block, for dedupe.
      const seen = new Set<string>();
      for (const n of getNodes()) {
        if (n.id.startsWith(`vid-${id}-`)) {
          seen.add((n.data as { label?: string }).label ?? "");
        }
      }

      let spawned = 0;
      for (const { key, leafBg, leafText } of VIDEO_CATEGORIES) {
        // New labels for this category (after dedupe).
        const labels = result[key]
          .map((raw) => truncate(raw))
          .filter((label) => label && !seen.has(label));
        if (labels.length === 0) continue;

        // Even, collision-free column beside the video block.
        const positions = distributeBesideHub(self, labels.length, occupied, {
          dir: 1,
          leafW,
          leafH,
        });

        labels.forEach((label, i) => {
          const pos = positions[i];
          const nodeId = `vid-${id}-${Date.now()}-${spawned}`;
          addNodes({
            id: nodeId,
            type: "default",
            position: pos,
            data: { label },
            style: leafNodeStyle(leafBg, leafText),
          });

          // Single edge: video block → leaf (provenance only).
          const vid = pickHandles(self, leafBox(pos));
          addEdges({
            id: `e-vid-${nodeId}`,
            source: id,
            target: nodeId,
            sourceHandle: vid.sourceHandle,
            targetHandle: vid.targetHandle,
            type: "labeled",
            data: { arrowEnd: true },
            markerEnd: EDGE_MARKER,
          });

          seen.add(label);
          spawned += 1;
        });
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

    // Persist inputs + mark in-flight (saved via canvas autosave).
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
      <QuickConnectArrows id={id} selected={!!selected} />

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={HANDLE_CLS}
      />

      <div
        className={[
          "rounded-2xl p-4 bg-[#f1f4fb] shadow-sm transition-shadow",
          selected ? "ring-2 ring-primary" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-1.5 mb-3 text-gray-700">
          <Film size={14} />
          <span className="text-sm font-bold">Analyse a video</span>
        </div>

        <div className="nodrag nopan flex flex-col gap-2.5">
          {/* Share-video link — on top */}
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => updateNodeData(id, { tiktokUrl: url.trim() })}
            disabled={analyzing}
            placeholder="Paste a TikTok share link…"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-primary disabled:opacity-60"
          />

          {/* User prompt — larger box below */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => updateNodeData(id, { userPrompt: prompt })}
            disabled={analyzing}
            rows={4}
            placeholder="What should we pull from this video? e.g. hook ideas, tone, shot list…"
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-primary disabled:opacity-60"
          />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-(--color-primary-hover) disabled:opacity-70"
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
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-emerald-600">
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
