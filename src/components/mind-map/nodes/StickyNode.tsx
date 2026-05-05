"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Handle,
  NodeProps,
  NodeResizer,
  Position,
  Node,
  useReactFlow,
} from "@xyflow/react";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";
import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StickyData = {
  text: string;
  color: string;
  fontSize: number;
};

export type StickyNodeType = Node<StickyData, "sticky">;

export const STICKY_COLORS = [
  { label: "Yellow", value: "#fef9c3" },
  { label: "Pink",   value: "#fce7f3" },
  { label: "Blue",   value: "#dbeafe" },
  { label: "Green",  value: "#dcfce7" },
  { label: "Purple", value: "#f3e8ff" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

export default function StickyNode({ id, data, selected }: NodeProps<StickyNodeType>) {
  const { updateNodeData, deleteElements } = useReactFlow();

  const textRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync external data.text → DOM only when not in edit mode
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
    const newText = textRef.current?.innerText ?? "";
    updateNodeData(id, { text: newText });
  }, [id, updateNodeData]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startEditing();
    },
    [startEditing]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        textRef.current?.blur();
      }
      if (e.key === "Delete") {
        deleteElements({ nodes: [{ id }], edges: [] });
      }
      e.stopPropagation();
    },
    [id, deleteElements]
  );

  const fontSize = data.fontSize ?? 14;

  return (
    <div className="group relative w-full h-full min-w-[60px] min-h-[60px] select-none">
      <NodeResizer
        isVisible={selected}
        minWidth={60}
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

      <NodeToolbar nodeType="sticky" id={id} data={data} selected={!!selected} />
      <QuickConnectArrows id={id} selected={!!selected} />

      <Handle type="source" position={Position.Top}    id="top"    className={HANDLE_CLS} />
      <Handle type="target" position={Position.Top}    id="top"    className={HANDLE_CLS} />
      <Handle type="source" position={Position.Left}   id="left"   className={HANDLE_CLS} />
      <Handle type="target" position={Position.Left}   id="left"   className={HANDLE_CLS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLS} />
      <Handle type="target" position={Position.Bottom} id="bottom" className={HANDLE_CLS} />
      <Handle type="source" position={Position.Right}  id="right"  className={HANDLE_CLS} />
      <Handle type="target" position={Position.Right}  id="right"  className={HANDLE_CLS} />

      <div
        className="absolute inset-0 rounded-sm shadow-md overflow-hidden"
        style={{ background: data.color ?? "#fef9c3" }}
      >
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={commitEdit}
          onKeyDown={isEditing ? handleKeyDown : undefined}
          style={{ fontSize }}
          className={[
            "w-full h-full p-3 leading-snug text-gray-800 break-words whitespace-pre-wrap",
            "focus:outline-none",
            isEditing ? "nodrag nopan cursor-text" : "cursor-default",
            !data.text && !isEditing ? "text-gray-400" : "",
          ].join(" ")}
        />

        {/* Folded corner */}
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.07) 50%)",
          }}
        />
      </div>
    </div>
  );
}
