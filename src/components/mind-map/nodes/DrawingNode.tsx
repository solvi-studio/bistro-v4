"use client";

import { getStroke } from "perfect-freehand";
import { NodeProps, NodeResizer, Node, useReactFlow } from "@xyflow/react";
import type { DrawPoint } from "@/components/mind-map/hooks/useDraw";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawingData = {
  points: DrawPoint[];
  color: string;
  size: number;
};

export type DrawingNodeType = Node<DrawingData, "drawing">;

// ─── SVG path helper ──────────────────────────────────────────────────────────

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length < 2) return "";
  const d: (string | number)[] = ["M", ...stroke[0], "Q"];
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push("Z");
  return d.join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrawingNode({ id, data, selected }: NodeProps<DrawingNodeType>) {
  const { deleteElements } = useReactFlow();

  const stroke = getStroke(data.points, {
    size: data.size ?? 4,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });
  const pathData = getSvgPathFromStroke(stroke);

  return (
    <div
      className="w-full h-full relative"
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          deleteElements({ nodes: [{ id }], edges: [] });
        }
      }}
      tabIndex={-1}
    >
      {/* {selected && (
        <NodeResizer
          minWidth={20}
          minHeight={20}
          lineStyle={{ border: "1.5px dashed #94a3b8" }}
          handleStyle={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", border: "1.5px solid #94a3b8" }}
        />
      )} */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      >
        <path d={pathData} fill={data.color ?? "#1a1a1a"} />
      </svg>
    </div>
  );
}
