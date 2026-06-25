"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizer,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";

export type SceneNodeType = Node<{ label?: string }, "scene">;

// Applied to the React Flow wrapper so it's transparent — SceneNode owns its
// own dark card styling via the inner div.
export const SCENE_NODE_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  boxShadow: "none",
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
  "!h-2 !w-2 border! !border-white !bg-gray-500 !opacity-0 transition-opacity hover:!opacity-100";

// Parse the highest "Scene N" number across all scene nodes so numbering stays
// monotonically increasing even after deletions.
function nextSceneLabel(scenes: { data: unknown }[]): string {
  const max = scenes.reduce((m, n) => {
    const match = /^Scene (\d+)$/.exec(
      (n.data as { label?: string }).label ?? "",
    );
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `Scene ${max + 1}`;
}

export default function SceneNode({
  id,
  data,
  selected,
}: NodeProps<SceneNodeType>) {
  const { updateNodeData, addNodes, addEdges, getNode, getNodes } =
    useReactFlow();
  const label = data.label ?? "Scene";

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
    else setDraft(label);
  }

  function addScene() {
    const self = getNode(id);
    if (!self) return;
    const scenes = getNodes().filter((n) => n.type === "scene");
    const newId = `scene-${Date.now()}`;
    const y = self.position.y + (self.measured?.height ?? 52) + 80;
    addNodes({
      id: newId,
      type: "scene",
      position: { x: self.position.x, y },
      data: { label: nextSceneLabel(scenes) },
      style: SCENE_NODE_STYLE,
      deletable: true,
    });
    addEdges({
      id: `se-${id}-${newId}`,
      source: id,
      target: newId,
      type: "sceneEdge",
      sourceHandle: "bottom",
      targetHandle: "top",
    });
  }

  return (
    <div className="group relative h-full w-full">
      <NodeToolbar nodeType="topic" id={id} selected={!!selected} />
      <NodeResizer
        isVisible={!!selected}
        minWidth={120}
        minHeight={44}
        lineClassName="!border-[var(--color-primary)]"
        handleClassName="!h-2 !w-2 !rounded-sm !border-[var(--color-primary)] !bg-white"
      />

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

      {/* Card fills the entire node wrapper so NodeResizer works correctly */}
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-white">
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
            className="nodrag nopan w-full bg-transparent text-center font-semibold text-white outline-none"
          />
        ) : (
          // biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit scene label
          <span
            className="block w-full text-center font-semibold"
            onDoubleClick={() => {
              setDraft(label);
              setEditing(true);
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* + button — sits below the node card via absolute positioning */}
      <button
        type="button"
        onClick={addScene}
        aria-label="Add next scene"
        className={[
          "nodrag nopan absolute left-1/2 top-full -translate-x-1/2 translate-y-2",
          "grid h-7 w-7 place-items-center rounded-full",
          "border border-gray-300 bg-white text-gray-500 shadow-sm",
          "transition-all hover:border-gray-900 hover:text-gray-900",
          selected
            ? "opacity-100 scale-100"
            : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
        ].join(" ")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
