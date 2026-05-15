"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Handle,
  Node,
  NodeProps,
  NodeResizeControl,
  Position,
  ResizeControlVariant,
  useReactFlow,
} from "@xyflow/react";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";
import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontSize = "sm" | "md" | "lg" | "xl";

export type TextBoxData = {
  html: string;
  fontSize: FontSize;
};

export type TextBoxNodeType = Node<TextBoxData, "textbox">;

export const FONT_SIZE_MAP: Record<FontSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
};

// ─── Component ────────────────────────────────────────────────────────────────

const HANDLE_CLS =
  "!w-2 !h-2 !rounded-full !border !border-gray-300 !bg-white opacity-0 group-hover:opacity-60 transition-opacity duration-150";

export default function TextBoxNode({
  id,
  data,
  selected,
}: NodeProps<TextBoxNodeType>) {
  const { deleteElements, getNode, updateNodeData } = useReactFlow();

  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  const fontSize = FONT_SIZE_MAP[data.fontSize ?? "md"];

  // Auto-focus on first mount (node was just placed)
  useEffect(() => {
    if (!data.html) {
      startEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external html → DOM when not editing
  useEffect(() => {
    if (!isEditingRef.current && editorRef.current) {
      editorRef.current.innerHTML = data.html ?? "";
    }
  }, [data.html]);

  const startEditing = useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
    setTimeout(() => {
      const el = editorRef.current;
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

    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText?.trim() ?? "";

    if (!text) {
      const node = getNode(id);
      if (node) deleteElements({ nodes: [node], edges: [] });
      return;
    }

    updateNodeData(id, { html });
  }, [id, deleteElements, getNode, updateNodeData]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startEditing();
    },
    [startEditing],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      editorRef.current?.blur();
    }
  }, []);

  return (
    <div className="group relative min-w-[80px]">
      <NodeToolbar
        nodeType="textbox"
        id={id}
        data={data}
        selected={!!selected}
        editorRef={editorRef}
        isEditing={isEditing}
        onStartEditing={startEditing}
      />
      <QuickConnectArrows id={id} selected={!!selected} />

      <NodeResizeControl
        variant={ResizeControlVariant.Line}
        position="left"
        minWidth={80}
        style={{ border: "none", width: 6, left: -3, cursor: "ew-resize" }}
        className={
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }
      />
      <NodeResizeControl
        variant={ResizeControlVariant.Line}
        position="right"
        minWidth={80}
        style={{ border: "none", width: 6, right: -3, cursor: "ew-resize" }}
        className={
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }
      />

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
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onDoubleClick={handleDoubleClick}
        onBlur={commitEdit}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        style={{ fontSize, minHeight: `${fontSize * 1.5}px` }}
        className={[
          "w-full px-1 leading-snug text-gray-800 break-words whitespace-pre-wrap",
          "focus:outline-none bg-transparent",
          isEditing ? "nodrag nopan cursor-text" : "cursor-default",
          selected && !isEditing
            ? "ring-1 ring-blue-300 ring-offset-1 rounded-sm"
            : "",
          !data.html && !isEditing ? "text-gray-300" : "",
        ].join(" ")}
      />
    </div>
  );
}
