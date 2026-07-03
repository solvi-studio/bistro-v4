"use client";

import {
  Handle,
  type Node,
  type NodeProps,
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
  /** User-editable body text. Absent for the "Timing" node, which uses
   * `duration` instead. */
  body?: string;
  /** "M:SS" — only present on the "Timing" node. */
  duration?: string;
  fontSize: number;
  /** User-set card width (persisted). Falls back to DEFAULT_W. */
  width?: number;
  /**
   * Minimum card height floor (persisted). The card grows taller when text
   * overflows, but never shrinks below this value.
   */
  minHeight?: number;
};

export type ContentNodeType = Node<ContentNodeData, "content">;

// ─── Constants ────────────────────────────────────────────────────────────

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

// Default / minimum dimensions (flow units).
const DEFAULT_W = 200;
const DEFAULT_MIN_H = 64;
const MIN_W = 140;
const MIN_H = 56;

// "M:SS" or "MM:SS", seconds 00-59.
const DURATION_PATTERN = /^\d{1,2}:\d{2}$/;

function isValidDuration(v: string): boolean {
  if (!DURATION_PATTERN.test(v)) return false;
  const seconds = Number(v.split(":")[1]);
  return seconds <= 59;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ContentNode({
  id,
  data,
  selected,
}: NodeProps<ContentNodeType>) {
  const { updateNodeData, deleteElements, getViewport } = useReactFlow();
  const theme = CATEGORY_THEME[data.category];
  const isTimingNode = data.header === "Timing";

  const bodyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  // Timing-node duration editing.
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState("");

  // Sync external data.body → DOM when not editing (avoids overwriting mid-edit).
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") bodyRef.current?.blur();
    e.stopPropagation();
  }, []);

  const startEditingDuration = useCallback((current: string) => {
    setDurationDraft(current);
    setEditingDuration(true);
  }, []);

  const commitDurationEdit = useCallback(() => {
    const value = durationDraft.trim();
    if (isValidDuration(value)) {
      updateNodeData(id, { duration: value });
    }
    setEditingDuration(false);
  }, [durationDraft, id, updateNodeData]);

  const cancelDurationEdit = useCallback(() => {
    setEditingDuration(false);
  }, []);

  // ── Custom bottom-right resize handle ────────────────────────────────────────
  //
  // NodeResizer/NodeResizeControl write a fixed node height, which prevents
  // auto-grow. Instead we track pointer delta ourselves and store the result as
  // data.width (fixed) + data.minHeight (floor). The card's actual height stays
  // content-driven so text always pushes it taller than the floor.
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const card = cardRef.current;
      if (!card) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = card.offsetWidth;
      const startH = card.offsetHeight;
      // Screen pixels ÷ zoom → flow units.
      const zoom = getViewport().zoom;

      const onMove = (me: PointerEvent) => {
        const newW = Math.round(
          Math.max(MIN_W, startW + (me.clientX - startX) / zoom),
        );
        const newH = Math.round(
          Math.max(MIN_H, startH + (me.clientY - startY) / zoom),
        );
        updateNodeData(id, { width: newW, minHeight: newH });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [id, updateNodeData, getViewport],
  );

  const cardWidth = data.width ?? DEFAULT_W;
  const cardMinH = data.minHeight ?? DEFAULT_MIN_H;

  return (
    // Outer wrapper has NO width/height — the node auto-measures to the card so
    // React Flow's collision box always matches what the user sees.
    <div className="group relative">
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

      {/*
        Card — width is fixed (resizable); minHeight is the floor.
        flex-col lets the body fill space up to minHeight, then grow taller.
        No overflow-auto / fixed height → text always visible, card grows.
      */}
      <div
        ref={cardRef}
        className="flex flex-col rounded-xl overflow-hidden shadow-sm"
        style={{
          width: cardWidth,
          minHeight: cardMinH,
          border: `1.5px solid ${theme.headerBg}`,
        }}
      >
        {/* Fixed header */}
        <div
          className="shrink-0 px-3 py-1.5 text-xs font-bold"
          style={{ background: theme.headerBg, color: theme.headerText }}
        >
          {data.header}
        </div>

        {isTimingNode ? (
          <div className="flex flex-1 items-center gap-1.5 px-3 py-2 bg-white">
            {editingDuration ? (
              <input
                // biome-ignore lint/a11y/noAutofocus: user just clicked edit
                autoFocus
                value={durationDraft}
                onChange={(e) => setDurationDraft(e.target.value)}
                onBlur={commitDurationEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitDurationEdit();
                  if (e.key === "Escape") cancelDurationEdit();
                }}
                placeholder="M:SS"
                className="nodrag nopan w-16 rounded-md border border-gray-300 px-1.5 py-0.5 text-sm text-gray-700 outline-none focus:border-gray-500"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEditingDuration(data.duration ?? "0:00")}
                style={{ fontSize: data.fontSize ?? 14, color: theme.bodyText }}
                className="hover:opacity-70 transition-opacity"
              >
                {data.duration ?? "0:00"}
              </button>
            )}
            {/* Display-only unit hint — never part of the stored value or any export. */}
            <span className="text-xs text-gray-400">seconds</span>
          </div>
        ) : (
          /*
            Editable body.
            flex-1 fills to minHeight; no overflow-auto so it grows the card instead
            of scrolling. break-words + whitespace-pre-wrap handles long text.
          */
          // biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit
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
              "flex-1 px-3 py-2 leading-snug bg-white min-h-[40px] break-words whitespace-pre-wrap",
              "focus:outline-none",
              isEditing ? "nodrag nopan cursor-text" : "cursor-default",
              !data.body && !isEditing ? "opacity-30" : "",
            ].join(" ")}
          />
        )}
      </div>

      {/* Bottom-right drag handle — only visible when node is selected */}
      {selected && (
        // nodrag nopan tells React Flow not to treat this as a node drag.
        <div
          className="nodrag nopan absolute bottom-0 right-0 cursor-se-resize"
          style={{ transform: "translate(35%, 35%)" }}
          onPointerDown={handleResizePointerDown}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              fill="white"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
