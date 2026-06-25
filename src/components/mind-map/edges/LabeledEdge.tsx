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
  type Position,
  useReactFlow,
} from "@xyflow/react";
import { ArrowLeft, ArrowRight, Trash2, Type } from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EdgeStyleType = "smoothstep" | "straight" | "bezier";

export type LabeledEdgeData = {
  label?: string;
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
  const { updateEdgeData, setEdges, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const edgeType: EdgeStyleType = data?.edgeType ?? "smoothstep";
  const label = data?.label ?? "";
  const arrowStart = data?.arrowStart ?? false;
  const arrowEnd = data?.arrowEnd ?? true;

  // Coordinates come from the connected handles (chosen once at creation via
  // pickHandles) — ReactFlow feeds sourceX/Y/Position + targetX/Y/Position.
  const [edgePath, labelX, labelY] = getEdgePath(edgeType, {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const toggleArrow = useCallback(
    (side: "start" | "end") => {
      const isStart = side === "start";
      const current = isStart ? arrowStart : arrowEnd;
      const next = !current;
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            markerStart: isStart
              ? next
                ? EDGE_MARKER
                : undefined
              : e.markerStart,
            markerEnd: !isStart
              ? next
                ? EDGE_MARKER
                : undefined
              : e.markerEnd,
            data: {
              ...e.data,
              [isStart ? "arrowStart" : "arrowEnd"]: next,
            },
          };
        }),
      );
    },
    [id, arrowStart, arrowEnd, setEdges],
  );

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const commitLabel = useCallback(
    (val: string) => {
      setIsEditing(false);
      updateEdgeData(id, { label: val.trim() });
    },
    [id, updateEdgeData],
  );

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

              {/* Arrow toggles */}
              <button
                type="button"
                title="Arrow at start (from)"
                onClick={() => toggleArrow("start")}
                className={[
                  "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
                  arrowStart
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                ].join(" ")}
              >
                <ArrowLeft size={12} />
              </button>

              <button
                type="button"
                title="Arrow at end (to)"
                onClick={() => toggleArrow("end")}
                className={[
                  "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
                  arrowEnd
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                ].join(" ")}
              >
                <ArrowRight size={12} />
              </button>

              <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />

              {/* Label edit */}
              <button
                type="button"
                title="Edit label"
                onClick={startEditing}
                className="h-6 w-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <Type size={12} />
              </button>

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

          {isEditing ? (
            <input
              ref={inputRef}
              defaultValue={label}
              placeholder="Label…"
              onBlur={(e) => commitLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel(e.currentTarget.value);
                if (e.key === "Escape") setIsEditing(false);
                e.stopPropagation();
              }}
              className="text-gray-600 text-xs bg-white border border-gray-300 rounded-lg px-2 py-0.5 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 min-w-15"
            />
          ) : label ? (
            // biome-ignore lint/a11y/noStaticElementInteractions: edge label double-click to edit
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-0.5 shadow-sm text-gray-600 hover:border-gray-300 cursor-pointer"
            >
              {label}
            </span>
          ) : selected ? (
            <button
              type="button"
              onClick={startEditing}
              className="text-xs text-gray-400 bg-white/80 border border-dashed border-gray-300 rounded-lg px-2 py-0.5 hover:text-gray-600 hover:border-gray-400 transition-colors"
            >
              + label
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
