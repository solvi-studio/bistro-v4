"use client";

import {
  Handle,
  type NodeProps,
  NodeResizer,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";

// Default mind-map node — the central idea, the four hubs, and every spawned
// topic leaf use this (registered as nodeTypes.default). It renders the label
// and a source+target handle on EACH side with stable ids ("top" | "right" |
// "bottom" | "left") so an edge can attach to a chosen side at creation time
// (see utils/mind-map-handles.ts). The label is editable (double-click); the
// node id never changes, so video-analysis edges stay attached after a rename.
// React Flow applies the node's `style` (palette) to the wrapper.

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
  "!h-2 !w-2 !border !border-white !bg-gray-400 !opacity-0 transition-opacity hover:!opacity-100";

export default function TopicNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const label = (data as { label?: string }).label ?? "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== label) updateNodeData(id, { label: next });
    else setDraft(label); // revert empty/unchanged
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

      {/* Back-compat: legacy edges saved without a handle id attach to these
          null-id handles (matches the old built-in default node). */}
      <Handle type="target" position={Position.Top} className={HANDLE_CLS} />
      <Handle type="source" position={Position.Bottom} className={HANDLE_CLS} />

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
    </>
  );
}
