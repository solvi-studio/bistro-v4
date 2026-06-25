"use client";

import {
  Handle,
  type NodeProps,
  NodeResizer,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";

// Default mind-map node — the central idea, the four hubs, and every spawned
// topic leaf use this (registered as nodeTypes.default). It renders the label
// and a source+target handle on EACH side with stable ids ("top" | "right" |
// "bottom" | "left") so an edge can attach to a chosen side at creation time.
// The label is editable (double-click).
//
// Layout note: React Flow applies the node's `style` (palette + padding) to
// its own wrapper div. We use `absolute inset-0` for the group overlay so it
// spans the FULL padding box (visual edges) regardless of the wrapper's
// padding — this keeps QuickConnectArrows and handles at the true node edges.

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
  "!h-2 !w-2 border! !border-white !bg-gray-400 !opacity-0 transition-opacity hover:!opacity-100";

export default function TopicNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const label = (data as { label?: string }).label ?? "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [dwelled, setDwelled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDwell = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => setDwelled(true), 1500);
  }, []);

  const cancelDwell = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = null;
    setDwelled(false);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== label) updateNodeData(id, { label: next });
    else setDraft(label);
  }

  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={80}
        minHeight={32}
        lineClassName="!border-[var(--color-primary)]"
        handleClassName="!h-2 !w-2 !rounded-sm !border-[var(--color-primary)] !bg-white"
      />
      <NodeToolbar nodeType="topic" id={id} selected={!!selected} />

      {/*
       * `absolute inset-0` spans the RF wrapper's full padding box (visual
       * edges), so QuickConnectArrows and handles position at the true node
       * boundary — not inset by whatever padding leafNodeStyle applies.
       */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover dwell detection for quick-connect arrows */}
      <div
        className="group absolute inset-0"
        onMouseEnter={startDwell}
        onMouseMove={startDwell}
        onMouseLeave={cancelDwell}
      >
        <QuickConnectArrows id={id} selected={!!selected} dwelled={dwelled} />

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
        {/* Back-compat: legacy edges saved without a handle id attach here. */}
        <Handle type="target" position={Position.Top} className={HANDLE_CLS} />
        <Handle
          type="source"
          position={Position.Bottom}
          className={HANDLE_CLS}
        />

        <div className="flex h-full w-full items-center justify-center">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(label);
                  setEditing(false);
                }
                e.stopPropagation();
              }}
              className="nodrag nopan w-full bg-transparent text-center outline-none"
            />
          ) : (
            // biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit the node label
            <span
              className="block w-full text-center"
              onDoubleClick={() => {
                setDraft(label);
                setEditing(true);
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
