"use client";

import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  MarkerType,
  Position,
  useInternalNode,
  useReactFlow,
} from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { type HandleSide, pickHandles } from "@/utils/mind-map-handles";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EdgeStyleType = "smoothstep" | "straight" | "bezier";

export type LabeledEdgeData = {
  edgeType?: EdgeStyleType;
  arrowStart?: boolean;
  arrowEnd?: boolean;
};

export type LabeledEdgeType = Edge<LabeledEdgeData, "labeled">;

// Marker config applied to edge when an arrow side is enabled
export const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 16,
  height: 16,
  color: "#9ca3af",
};

// ─── Dynamic handle coords ───────────────────────────────────────────────────

function sideToCoords(
  absPos: { x: number; y: number },
  w: number,
  h: number,
  side: HandleSide,
): { x: number; y: number; position: Position } {
  switch (side) {
    case "top":
      return { x: absPos.x + w / 2, y: absPos.y, position: Position.Top };
    case "bottom":
      return {
        x: absPos.x + w / 2,
        y: absPos.y + h,
        position: Position.Bottom,
      };
    case "left":
      return { x: absPos.x, y: absPos.y + h / 2, position: Position.Left };
    case "right":
      return { x: absPos.x + w, y: absPos.y + h / 2, position: Position.Right };
  }
}

// ─── Node box size ────────────────────────────────────────────────────────────
// Mirrors mind-map-layout.ts's nodeSize(): prefer RF's measured size, then
// explicit node-level width/height, then data.width/minHeight (what a manual
// resize writes immediately — measured can lag behind it by a frame or more
// via React Flow's async ResizeObserver), then fall back to a default.
function nodeBoxSize(node: {
  measured?: { width?: number; height?: number };
  width?: number | null;
  height?: number | null;
  data?: unknown;
}): { w: number; h: number } {
  const data = (node.data ?? {}) as Record<string, unknown>;
  return {
    w:
      node.measured?.width ??
      node.width ??
      (typeof data.width === "number" ? data.width : undefined) ??
      150,
    h:
      node.measured?.height ??
      node.height ??
      (typeof data.minHeight === "number" ? data.minHeight : undefined) ??
      50,
  };
}

// ─── Path helper ──────────────────────────────────────────────────────────────

function getEdgePath(
  type: EdgeStyleType,
  params: {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
  },
) {
  if (type === "straight") return getStraightPath(params);
  if (type === "bezier") return getBezierPath(params);
  return getSmoothStepPath(params);
}

const EDGE_STYLE_LABELS: Record<EdgeStyleType, string> = {
  smoothstep: "Smooth",
  straight: "Line",
  bezier: "Curve",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LabeledEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  selected,
  markerStart,
  markerEnd,
  data,
}: EdgeProps<LabeledEdgeType>) {
  const { updateEdgeData, deleteElements } = useReactFlow();

  const edgeType: EdgeStyleType = data?.edgeType ?? "smoothstep";

  // Re-pick handles dynamically from current node positions so the edge always
  // exits/enters the closest side regardless of which handle was stored at creation.
  const srcNode = useInternalNode(source);
  const tgtNode = useInternalNode(target);

  let sX = sourceX,
    sY = sourceY,
    sPos = sourcePosition;
  let tX = targetX,
    tY = targetY,
    tPos = targetPosition;

  if (srcNode && tgtNode) {
    const srcAbs = srcNode.internals.positionAbsolute;
    const tgtAbs = tgtNode.internals.positionAbsolute;
    const { w: srcW, h: srcH } = nodeBoxSize(srcNode);
    const { w: tgtW, h: tgtH } = nodeBoxSize(tgtNode);

    const { sourceHandle, targetHandle } = pickHandles(
      { position: srcAbs, measured: { width: srcW, height: srcH } },
      { position: tgtAbs, measured: { width: tgtW, height: tgtH } },
    );

    const s = sideToCoords(srcAbs, srcW, srcH, sourceHandle);
    const t = sideToCoords(tgtAbs, tgtW, tgtH, targetHandle);
    sX = s.x;
    sY = s.y;
    sPos = s.position;
    tX = t.x;
    tY = t.y;
    tPos = t.position;
  }

  const [edgePath, labelX, labelY] = getEdgePath(edgeType, {
    sourceX: sX,
    sourceY: sY,
    sourcePosition: sPos,
    targetX: tX,
    targetY: tY,
    targetPosition: tPos,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? "#6366f1" : "#9ca3af",
          strokeWidth: selected ? 2 : 1.5,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {selected && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-white border border-gray-200 rounded-xl shadow-md px-2 py-1.5 flex items-center gap-1 text-xs select-none whitespace-nowrap z-10">
              {/* Path type */}
              {(["smoothstep", "straight", "bezier"] as EdgeStyleType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    title={t}
                    onClick={() => updateEdgeData(id, { edgeType: t })}
                    className={[
                      "h-6 px-1.5 rounded-md text-[10px] font-medium transition-colors",
                      edgeType === t
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                    ].join(" ")}
                  >
                    {EDGE_STYLE_LABELS[t]}
                  </button>
                ),
              )}

              <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />

              {/* Delete */}
              <button
                type="button"
                title="Delete edge"
                onClick={() => deleteElements({ nodes: [], edges: [{ id }] })}
                className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
