"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORY_THEME,
  type ContentCategory,
} from "@/components/mind-map/constants/topics";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ContentCategory };

export type ContentNodeData = {
  category: ContentCategory;
  /** Fixed label shown in the coloured header. */
  header: string;
  /** User-editable body text. */
  body: string;
  fontSize: number;
};

export type ContentNodeType = Node<ContentNodeData, "content">;

// ─── Constants ────────────────────────────────────────────────────────────────

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

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

const FONT_SIZES = [
  { label: "S", value: 12 },
  { label: "M", value: 14 },
  { label: "L", value: 18 },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContentNode({
  id,
  data,
  selected,
}: NodeProps<ContentNodeType>) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const theme = CATEGORY_THEME[data.category];

  const bodyRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync external data.body → DOM only when not editing
  useEffect(() => {
    if (!isEditingRef.current && bodyRef.current) {
      bodyRef.current.innerText = data.body ?? "";
    }
  }, [data.body]);

  const startEditing = useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
    setTimeout(() => {
      const el = bodyRef.current;
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
    updateNodeData(id, { body: bodyRef.current?.innerText ?? "" });
  }, [id, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") bodyRef.current?.blur();
      e.stopPropagation();
    },
    [],
  );

  return (
    <div className="group relative w-[200px]">
      <NodeResizer
        isVisible={!!selected}
        minWidth={120}
        minHeight={60}
        lineStyle={{ border: "1.5px solid #94a3b8" }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#fff",
          border: "1.5px solid #94a3b8",
        }}
      />

      {/* Floating toolbar — font size + delete */}
      <NodeToolbar isVisible={!!selected} position={Position.Top} offset={8}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-md px-2 py-1.5 flex items-center gap-1 text-xs select-none">
          {FONT_SIZES.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => updateNodeData(id, { fontSize: value })}
              className={[
                "h-6 min-w-6 px-1 rounded-md flex items-center justify-center font-medium transition-colors",
                (data.fontSize ?? 14) === value
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />
          <button
            type="button"
            title="Delete"
            onClick={() => deleteElements({ nodes: [{ id }], edges: [] })}
            className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </NodeToolbar>

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
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: `1.5px solid ${theme.headerBg}` }}
      >
        {/* Fixed header */}
        <div
          className="px-3 py-1.5 text-xs font-bold"
          style={{ background: theme.headerBg, color: theme.headerText }}
        >
          {data.header}
        </div>

        {/* Editable body */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit body */}
        <div
          ref={bodyRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
          onBlur={commitEdit}
          onKeyDown={isEditing ? handleKeyDown : undefined}
          style={{ fontSize: data.fontSize ?? 14, color: theme.bodyText }}
          className={[
            "px-3 py-2 leading-snug bg-white min-h-[40px] wrap-break-word whitespace-pre-wrap",
            "focus:outline-none",
            isEditing ? "nodrag nopan cursor-text" : "cursor-default",
            !data.body && !isEditing ? "opacity-30" : "",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
