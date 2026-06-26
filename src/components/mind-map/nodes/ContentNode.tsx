"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { BarChart2, FileText, Headphones, Image, Trash2 } from "lucide-react";

export type ContentCategory = "visual" | "audio" | "script" | "videoAnalysis";

export type ContentNodeData = {
  category: ContentCategory;
  option: string;
};

export type ContentNodeType = Node<ContentNodeData, "content">;

const CATEGORY_CONFIG: Record<
  ContentCategory,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  visual: {
    icon: Image,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  audio: {
    icon: Headphones,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  script: {
    icon: FileText,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  videoAnalysis: {
    icon: BarChart2,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};

const SIDES = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

const SIDE_ID: Record<Position, string> = {
  [Position.Top]: "top",
  [Position.Right]: "right",
  [Position.Bottom]: "bottom",
  [Position.Left]: "left",
};

const HANDLE_CLS =
  "h-2 w-2 border border-white bg-gray-400 opacity-0 transition-opacity hover:opacity-100";

export default function ContentNode({
  id,
  data,
  selected,
}: NodeProps<ContentNodeType>) {
  const { deleteElements } = useReactFlow();
  const config = CATEGORY_CONFIG[data.category];
  const Icon = config.icon;

  return (
    <div className="group relative">
      {SIDES.map((pos) => (
        <Handle
          key={`s-${pos}`}
          type="source"
          id={SIDE_ID[pos]}
          position={pos}
          className={HANDLE_CLS}
        />
      ))}
      {SIDES.map((pos) => (
        <Handle
          key={`t-${pos}`}
          type="target"
          id={SIDE_ID[pos]}
          position={pos}
          className={HANDLE_CLS}
        />
      ))}

      <div
        className={[
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm whitespace-nowrap",
          config.bg,
          config.text,
          config.border,
          selected ? "ring-2 ring-offset-1 ring-current ring-opacity-50" : "",
        ].join(" ")}
      >
        <Icon size={14} />
        <span>{data.option}</span>
      </div>

      {selected && (
        <button
          type="button"
          onClick={() => deleteElements({ nodes: [{ id }], edges: [] })}
          className="nodrag nopan absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
}
