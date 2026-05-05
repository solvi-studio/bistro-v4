"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { ChevronUp, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";
import { useTool } from "@/components/mind-map/context/ToolContext";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = "top" | "right" | "bottom" | "left";

// ─── Per-type defaults for new node creation ──────────────────────────────────

type NodeDefaults = {
  data: Record<string, unknown>;
  style: Record<string, unknown>;
  w: number;
  h: number;
};

const TYPE_DEFAULTS: Record<string, NodeDefaults> = {
  sticky:  { data: { text: "", color: "#fef9c3", fontSize: 14 },                                          style: { width: 160, height: 160 }, w: 160, h: 160 },
  shape:   { data: { text: "", shape: "rectangle", fillColor: "#ffffff", strokeColor: "#94a3b8", fontSize: 14 }, style: { width: 80,  height: 80  }, w: 80,  h: 80  },
  textbox: { data: { html: "", fontSize: "md" },                                                           style: { width: 200             }, w: 200, h: 60  },
};

const FALLBACK: NodeDefaults = TYPE_DEFAULTS.sticky;

// ─── Direction config ─────────────────────────────────────────────────────────

// Which handle exits the source and which handle receives on the target
const DIR_HANDLES: Record<Direction, { sourceHandle: string; targetHandle: string }> = {
  right:  { sourceHandle: "right",  targetHandle: "left"   },
  left:   { sourceHandle: "left",   targetHandle: "right"  },
  bottom: { sourceHandle: "bottom", targetHandle: "top"    },
  top:    { sourceHandle: "top",    targetHandle: "bottom" },
};

const GAP = 80;

// Position new node centered on the perpendicular axis, using new node's own dimensions
function getDirOffset(
  dir: Direction,
  sw: number, sh: number,  // source dimensions
  nw: number, nh: number   // new node dimensions
): { x: number; y: number } {
  switch (dir) {
    case "right":  return { x: sw + GAP,       y: (sh - nh) / 2 };
    case "left":   return { x: -(nw + GAP),    y: (sh - nh) / 2 };
    case "bottom": return { x: (sw - nw) / 2,  y: sh + GAP };
    case "top":    return { x: (sw - nw) / 2,  y: -(nh + GAP) };
  }
}

const DIR_CONFIG: Record<Direction, { posClass: string; Icon: React.ComponentType<{ size?: number }> }> = {
  top:    { posClass: "top-0    left-1/2 -translate-x-1/2 -translate-y-[calc(100%+10px)]", Icon: ChevronUp    },
  right:  { posClass: "right-0  top-1/2  -translate-y-1/2  translate-x-[calc(100%+10px)]", Icon: ChevronRight },
  bottom: { posClass: "bottom-0 left-1/2 -translate-x-1/2  translate-y-[calc(100%+10px)]", Icon: ChevronDown  },
  left:   { posClass: "left-0   top-1/2  -translate-y-1/2 -translate-x-[calc(100%+10px)]", Icon: ChevronLeft  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuickConnectArrows({
  id,
  selected,
}: {
  id: string;
  selected: boolean;
}) {
  const { activeTool } = useTool();
  const { addNodes, addEdges, getNode } = useReactFlow();

  const handleConnect = useCallback(
    (direction: Direction) => {
      const source = getNode(id);
      if (!source) return;

      const sw = source.measured?.width  ?? 160;
      const sh = source.measured?.height ?? 160;

      const nodeType = source.type ?? "sticky";
      const defaults = TYPE_DEFAULTS[nodeType] ?? FALLBACK;

      const { x: dx, y: dy } = getDirOffset(direction, sw, sh, defaults.w, defaults.h);
      const { sourceHandle, targetHandle } = DIR_HANDLES[direction];

      const newId = `${nodeType}-${Date.now()}`;

      addNodes({
        id: newId,
        type: nodeType,
        position: { x: source.position.x + dx, y: source.position.y + dy },
        data: { ...defaults.data },
        style: { ...defaults.style },
      });

      addEdges({
        id: `e-${id}-${newId}`,
        source: id,
        sourceHandle,
        target: newId,
        targetHandle,
        type: "labeled",
        data: { arrowEnd: true },
        markerEnd: EDGE_MARKER,
      });
    },
    [id, getNode, addNodes, addEdges]
  );

  if (activeTool !== "select") return null;

  return (
    <>
      {(["top", "right", "bottom", "left"] as Direction[]).map((dir) => {
        const { posClass, Icon } = DIR_CONFIG[dir];
        return (
          <button
            key={dir}
            type="button"
            title={`Add connected node (${dir})`}
            onClick={(e) => {
              e.stopPropagation();
              handleConnect(dir);
            }}
            className={[
              "absolute z-10 w-6 h-6 rounded-full",
              "bg-white border border-gray-300 shadow-sm",
              "flex items-center justify-center",
              "text-gray-400 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-500",
              "transition-all nodrag nopan",
              selected
                ? "opacity-100 scale-100"
                : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              posClass,
            ].join(" ")}
          >
            <Icon size={12} />
          </button>
        );
      })}
    </>
  );
}
