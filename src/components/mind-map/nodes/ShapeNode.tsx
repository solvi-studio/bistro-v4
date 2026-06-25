"use client";

import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";
import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";
import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "hexagon"
  | "cloud";

export type ShapeData = {
  text: string;
  shape: ShapeType;
  fillColor: string;
  strokeColor: string;
  fontSize: number;
};

export type ShapeNodeType = Node<ShapeData, "shape">;

export const DEFAULT_DIMS: Record<
  ShapeType,
  { width: number; height: number }
> = {
  rectangle: { width: 80, height: 80 },
  circle: { width: 120, height: 120 },
  ellipse: { width: 200, height: 100 },
  hexagon: { width: 140, height: 120 },
  cloud: { width: 180, height: 120 },
};

export const SHAPE_FILL_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Green", value: "#dcfce7" },
  { label: "Yellow", value: "#fef9c3" },
  { label: "Purple", value: "#f3e8ff" },
] as const;

export const SHAPE_TYPES: ShapeType[] = [
  "rectangle",
  "circle",
  "ellipse",
  "hexagon",
  "cloud",
];

export const SHAPE_ICONS: Record<ShapeType, React.ReactNode> = {
  rectangle: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
    >
      <rect x="1" y="3" width="12" height="8" rx="1" />
    </svg>
  ),
  circle: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="7" cy="7" r="5.5" />
    </svg>
  ),
  ellipse: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
    >
      <ellipse cx="7" cy="7" rx="6" ry="4" />
    </svg>
  ),
  hexagon: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
    >
      <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" />
    </svg>
  ),
  cloud: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
    >
      <path d="M3,10 C1,10 1,7.5 2.5,7 C2,4.5 4,3 6,4 C6.5,2 9,2 9.5,4 C11.5,4 12.5,6 11.5,7.5 C13,8 12.5,10.5 11,10.5 C10.5,12 8.5,12 7.5,10.5 C6.5,12 3.5,12 3,10 Z" />
    </svg>
  ),
};

// ─── SVG shape renderer ───────────────────────────────────────────────────────

function ShapePath({
  shape,
  fill,
  stroke,
}: {
  shape: ShapeType;
  fill: string;
  stroke: string;
}) {
  const p = {
    fill,
    stroke,
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  };
  switch (shape) {
    case "rectangle":
      return <rect x="1.5" y="1.5" width="97" height="97" rx="8" {...p} />;
    case "circle":
    case "ellipse":
      return <ellipse cx="50" cy="50" rx="48.5" ry="48.5" {...p} />;
    case "hexagon":
      return (
        <polygon points="26,1.5 74,1.5 98.5,50 74,98.5 26,98.5 1.5,50" {...p} />
      );
    case "cloud":
      return (
        <path
          d="M 25,70 C 10,70 5,55 15,47 C 10,28 28,18 42,25 C 46,8 68,8 72,22 C 85,20 95,32 90,45 C 100,50 98,65 85,68 C 82,80 65,83 55,75 C 48,85 33,85 25,70 Z"
          {...p}
        />
      );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

export default function ShapeNode({
  id,
  data,
  selected,
}: NodeProps<ShapeNodeType>) {
  const { updateNodeData, deleteElements } = useReactFlow();

  const textRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditingRef.current && textRef.current) {
      textRef.current.innerText = data.text ?? "";
    }
  }, [data.text]);

  const startEditing = useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
    setTimeout(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }, 0);
  }, []);

  const commitEdit = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    updateNodeData(id, { text: textRef.current?.innerText ?? "" });
  }, [id, updateNodeData]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startEditing();
    },
    [startEditing],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") textRef.current?.blur();
      if (e.key === "Delete") deleteElements({ nodes: [{ id }], edges: [] });
      e.stopPropagation();
    },
    [id, deleteElements],
  );

  return (
    <div
      className="group relative w-full h-full"
      style={{ minWidth: 20, minHeight: 20 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={20}
        minHeight={20}
        lineStyle={{ border: "none" }}
        handleStyle={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#fff",
          border: "1.5px solid #94a3b8",
        }}
      />

      <NodeToolbar nodeType="shape" id={id} data={data} selected={!!selected} />
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

      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <ShapePath
            shape={data.shape ?? "rectangle"}
            fill={data.fillColor ?? "#ffffff"}
            stroke={data.strokeColor ?? "#94a3b8"}
          />
        </svg>

        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={commitEdit}
          onKeyDown={isEditing ? handleKeyDown : undefined}
          style={{ fontSize: data.fontSize ?? 14 }}
          className={[
            "absolute inset-0 flex items-center justify-center",
            "px-3 py-2 text-center leading-snug text-gray-800 wrap-break-word whitespace-pre-wrap",
            "focus:outline-none",
            isEditing ? "nodrag nopan cursor-text" : "cursor-default",
            !data.text && !isEditing ? "text-gray-400" : "",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
