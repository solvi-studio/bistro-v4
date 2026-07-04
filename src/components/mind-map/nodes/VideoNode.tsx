"use client";

import {
  type Edge,
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
import { useCallback, useEffect, useState } from "react";
import {
  CATEGORY_THEME,
  TYPE_TO_CONTENT,
  VIDEO_ANALYSIS_TYPES,
  type VideoAnalysisType,
} from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";
import { pickHandles } from "@/utils/mind-map-handles";
import { distributeGrid, type Rect, rectOf } from "@/utils/mind-map-layout";
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
  /** Persisted analysis type selections so they survive canvas save/load. */
  types?: VideoAnalysisType[];
  startOffset?: number;
  endOffset?: number;
  note?: string;
  resultCount?: number;
};

export type VideoDropNodeType = Node<VideoDropData, "videoDrop">;

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

// Result node dimensions — ~1.5:1 landscape card.
const CELL_W = 260;
const CELL_H = 175;
const GRID_GAP = 28;
// Gap between the video node edge and the start of the result grid.
const ANCHOR_GAP = 64;

// Headers of content nodes already connected to this video node — used to
// skip re-fetching/re-spawning a type that's already represented on the
// canvas, whether it was spawned by this video node or manually connected.
function connectedContentHeaders(
  videoNodeId: string,
  allNodes: Node[],
  allEdges: Edge[],
): Set<string> {
  const contentIds = new Set<string>();
  for (const e of allEdges) {
    if (e.source === videoNodeId) contentIds.add(e.target);
    else if (e.target === videoNodeId) contentIds.add(e.source);
  }
  const headers = new Set<string>();
  for (const n of allNodes) {
    if (n.type === "content" && contentIds.has(n.id)) {
      headers.add((n.data as ContentNodeData).header);
    }
  }
  return headers;
}

// Best-effort: pull the first "M:SS"-shaped token out of the backend's
// free-text "timing" content. The backend is an external service (not in
// this repo) with an unverified text format, so this must degrade safely.
const DURATION_TOKEN = /\d{1,2}:\d{2}/;

function dedupeKey(
  header: string,
  d: { body?: string; duration?: string },
): string {
  if (header === "Timing") {
    return `${header}::${d.duration ?? "0:10"}`;
  }
  return `${header}::${d.body ?? ""}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoNode({
  id,
  data,
  selected,
}: NodeProps<VideoDropNodeType>) {
  const { updateNodeData, getNode, getNodes, getEdges, addNodes, addEdges } =
    useReactFlow();

  const status = data.status ?? "idle";
  const [url, setUrl] = useState(data.tiktokUrl ?? "");
  const [selectedTypes, setSelectedTypes] = useState<Set<VideoAnalysisType>>(
    () => new Set(data.types ?? []),
  );
  const [start, setStart] = useState(data.startOffset ?? 0);
  const [end, setEnd] = useState(data.endOffset ?? 30);

  // A persisted "analyzing" status only ever means the page reloaded (or the
  // canvas was reopened) mid-request — the in-flight fetch died with the old
  // page, so there's nothing left to wait for. Reset it once on mount so the
  // node isn't stuck showing a permanent spinner with no way to retry.
  // Mount-only: recovers stale persisted state, must not react to status
  // changes from a real in-session analysis run.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only
  useEffect(() => {
    if (data.status === "analyzing") {
      updateNodeData(id, {
        status: "error",
        note: "Analysis was interrupted by a page reload. Try again.",
      });
    }
  }, []);

  const toggleType = useCallback(
    (type: VideoAnalysisType) => {
      setSelectedTypes((prev) => {
        const next = new Set(prev);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        updateNodeData(id, { types: [...next] });
        return next;
      });
    },
    [id, updateNodeData],
  );

  // ── Spawn analysis results as content nodes ─────────────────────────────────
  const spawnResults = useCallback(
    (result: VideoMindmapResult): number => {
      const self = getNode(id);
      if (!self) return 0;

      const allNodes = getNodes();
      const allEdges = getEdges();
      const occupied: Rect[] = allNodes.map(rectOf);

      // ── Dedupe against nodes already spawned from this video block ──────────
      const seen = new Set<string>();
      for (const n of allNodes) {
        if (n.id.startsWith(`vid-${id}-`)) {
          const d = n.data as ContentNodeData;
          seen.add(dedupeKey(d.header, d));
        }
      }

      // ── Collect valid new nodes ─────────────────────────────────────────────
      type PendingNode = {
        mapping: { category: ContentNodeData["category"]; header: string };
        body?: string;
        duration?: string;
      };
      const pending: PendingNode[] = [];
      for (const { type, content } of result.nodes) {
        const mapping = TYPE_TO_CONTENT[type as VideoAnalysisType];
        if (!mapping) continue; // defensive: unknown type from BE

        if (mapping.header === "Timing") {
          const match = content.match(DURATION_TOKEN);
          const duration = match?.[0] ?? "0:10";
          const key = dedupeKey(mapping.header, { duration });
          if (seen.has(key)) continue;
          pending.push({ mapping, duration });
          continue;
        }

        const body = content.trim();
        if (!body || seen.has(dedupeKey(mapping.header, { body }))) continue;
        pending.push({ mapping, body });
      }

      if (pending.length === 0) return 0;

      // ── Determine placement direction ────────────────────────────────────────
      const selfW = self.measured?.width ?? 280;
      const selfH = self.measured?.height ?? 200;
      const selfCenterX = self.position.x + selfW / 2;
      const selfCenterY = self.position.y + selfH / 2;

      // Find a scene node connected to this video node (by node type, not edge id).
      let dir: -1 | 1 = 1; // default: place to the right
      for (const e of allEdges) {
        if (e.source !== id && e.target !== id) continue;
        const otherId = e.source === id ? e.target : e.source;
        const other = allNodes.find((n) => n.id === otherId);
        if (other?.type === "scene") {
          // Push results away from the scene.
          const sceneCenterX =
            other.position.x + (other.measured?.width ?? 200) / 2;
          dir = sceneCenterX < selfCenterX ? 1 : -1;
          break;
        }
      }

      // No scene found → pick the emptier side.
      if (dir === 1) {
        const rightCount = occupied.filter(
          (r) => r.x > self.position.x + selfW,
        ).length;
        const leftCount = occupied.filter(
          (r) => r.x + r.w < self.position.x,
        ).length;
        if (leftCount < rightCount) dir = -1;
      }

      // ── Grid anchor ─────────────────────────────────────────────────────────
      const cols = 2;
      const rows = Math.ceil(pending.length / cols);
      const gridH = rows * CELL_H + (rows - 1) * GRID_GAP;

      const baseX =
        dir > 0
          ? self.position.x + selfW + ANCHOR_GAP
          : self.position.x - ANCHOR_GAP - CELL_W;
      const baseY = selfCenterY - gridH / 2;

      // ── Layout all positions at once ─────────────────────────────────────────
      const positions = distributeGrid(baseX, baseY, pending.length, occupied, {
        cols,
        cellW: CELL_W,
        cellH: CELL_H,
        gap: GRID_GAP,
        dir,
      });

      // ── Spawn nodes + edges ──────────────────────────────────────────────────
      let spawned = 0;
      const leafBox = (pos: { x: number; y: number }) => ({
        position: pos,
        width: CELL_W,
        height: CELL_H,
      });

      pending.forEach((p, i) => {
        const pos = positions[i];
        const nodeId = `vid-${id}-${Date.now()}-${spawned}`;

        const nodeData: ContentNodeData =
          p.mapping.header === "Timing"
            ? {
                category: p.mapping.category,
                header: p.mapping.header,
                duration: p.duration,
                fontSize: 14,
                width: CELL_W,
                minHeight: CELL_H,
              }
            : {
                category: p.mapping.category,
                header: p.mapping.header,
                body: p.body,
                fontSize: 14,
                width: CELL_W,
                minHeight: CELL_H,
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

        seen.add(dedupeKey(p.mapping.header, p));
        spawned += 1;
      });

      return spawned;
    },
    [id, getNode, getNodes, getEdges, addNodes, addEdges],
  );

  // ── Analyse handler ──────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const tiktokUrl = url.trim();
    // Clamp offsets: start ≥ 0, end > start (BE rejects end ≤ start).
    const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0;
    const safeEnd = Number.isFinite(end) ? Math.max(safeStart + 1, end) : 30;

    if (!isTikTokUrl(tiktokUrl)) {
      updateNodeData(id, {
        status: "error",
        note: "Enter a valid TikTok video link.",
        tiktokUrl,
      });
      return;
    }
    if (selectedTypes.size === 0) {
      updateNodeData(id, {
        status: "error",
        note: "Pick at least one thing to analyse.",
        tiktokUrl,
      });
      return;
    }

    updateNodeData(id, {
      status: "analyzing",
      tiktokUrl,
      types: [...selectedTypes],
      startOffset: safeStart,
      endOffset: safeEnd,
    });

    // Skip types that already have a connected content node — no need to
    // re-fetch or re-spawn them.
    const connectedHeaders = connectedContentHeaders(
      id,
      getNodes(),
      getEdges(),
    );
    const typesToFetch = [...selectedTypes].filter((t) => {
      const mapping = TYPE_TO_CONTENT[t];
      return mapping && !connectedHeaders.has(mapping.header);
    });

    if (typesToFetch.length === 0) {
      updateNodeData(id, {
        status: "done",
        note: "These ideas are already on your canvas.",
        resultCount: 0,
      });
      return;
    }

    try {
      const result = await analyzeVideoMindmap(
        id,
        tiktokUrl,
        typesToFetch,
        safeStart,
        safeEnd,
      );
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
  }, [
    id,
    url,
    selectedTypes,
    start,
    end,
    updateNodeData,
    spawnResults,
    getNodes,
    getEdges,
  ]);

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

      {/* Teal card */}
      <div
        className={[
          "rounded-2xl p-4 shadow-sm transition-shadow",
          selected ? "ring-2 ring-[#0f766e]" : "",
        ].join(" ")}
        style={{ backgroundColor: "#e4f2eb" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5 mb-3"
          style={{ color: "#0f766e" }}
        >
          <Film size={14} />
          <span className="text-sm font-bold">Analyse a video</span>
        </div>

        <div className="nodrag nopan flex flex-col gap-3">
          {/* TikTok URL */}
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => updateNodeData(id, { tiktokUrl: url.trim() })}
            disabled={analyzing}
            placeholder="Paste a TikTok share link…"
            className="w-full rounded-xl border border-[#4caf87]/40 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#0f766e] disabled:opacity-60"
          />

          {/* Type picker — pill chips grouped by category */}
          <div className="flex flex-col gap-2.5">
            {VIDEO_ANALYSIS_TYPES.map((group) => {
              const theme = CATEGORY_THEME[group.category];
              return (
                <div key={group.category}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wide mb-1.5"
                    style={{ color: theme.headerText }}
                  >
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.types.map((t) => {
                      const active = selectedTypes.has(t.value);
                      return (
                        <button
                          key={t.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleType(t.value)}
                          disabled={analyzing}
                          className="rounded-full px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          style={
                            active
                              ? {
                                  backgroundColor: theme.headerText,
                                  color: "#fff",
                                  borderColor: theme.headerText,
                                }
                              : {
                                  backgroundColor: "#fff",
                                  color: theme.bodyText,
                                  borderColor: `${theme.headerText}55`,
                                }
                          }
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time window */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 shrink-0">
              Window
            </span>
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <span className="text-[10px]">Start</span>
              <input
                type="number"
                min={0}
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                onBlur={() => updateNodeData(id, { startOffset: start })}
                disabled={analyzing}
                className="w-15 rounded-lg border border-[#4caf87]/40 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-[#0f766e] disabled:opacity-60"
              />
              <span className="text-[10px] text-gray-400">s</span>
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <span className="text-[10px]">End</span>
              <input
                type="number"
                min={0}
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                onBlur={() => updateNodeData(id, { endOffset: end })}
                disabled={analyzing}
                className="w-15 rounded-lg border border-[#4caf87]/40 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-[#0f766e] disabled:opacity-60"
              />
              <span className="text-[10px] text-gray-400">s</span>
            </label>
          </div>

          {/* Analyse button */}
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
