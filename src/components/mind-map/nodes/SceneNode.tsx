"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizer,
  Position,
  useReactFlow,
} from "@xyflow/react";
import {
  BarChart2,
  Clapperboard,
  ClipboardEdit,
  Headphones,
  Image,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NodeToolbar from "@/components/mind-map/toolbar/NodeToolbar";
import type { ContentCategory } from "./ContentNode";

export type SceneNodeType = Node<{ label?: string }, "scene">;

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

function nextSceneLabel(scenes: { data: unknown }[]): string {
  const max = scenes.reduce((m, n) => {
    const match = /^Scene (\d+)$/.exec(
      (n.data as { label?: string }).label ?? "",
    );
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `Scene ${max + 1}`;
}

// ─── Toolbar config ───────────────────────────────────────────────────────────

type ToolbarItem =
  | { id: "scene"; icon: React.ElementType; label: string; type: "direct" }
  | { id: "videoAnalysis"; icon: React.ElementType; label: string; type: "direct" }
  | {
      id: string;
      icon: React.ElementType;
      label: string;
      type: "menu";
      category: ContentCategory;
      options: readonly string[];
    };

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: "scene", icon: Clapperboard, label: "Add Scene", type: "direct" },
  {
    id: "visual",
    icon: Image,
    label: "Add Visual",
    type: "menu",
    category: "visual",
    options: ["B-Roll", "Stock Footage", "Photo", "Text Overlay"],
  },
  {
    id: "audio",
    icon: Headphones,
    label: "Add Audio",
    type: "menu",
    category: "audio",
    options: ["Voiceover", "Trending Music", "Sound Effect"],
  },
  {
    id: "script",
    icon: ClipboardEdit,
    label: "Add Script",
    type: "menu",
    category: "script",
    options: ["Hook", "Key Message", "Call to Action"],
  },
  {
    id: "videoAnalysis",
    icon: BarChart2,
    label: "Video Analysis",
    type: "direct",
  },
];

// ─── SceneNode ────────────────────────────────────────────────────────────────

export default function SceneNode({
  id,
  data,
  selected,
}: NodeProps<SceneNodeType>) {
  const { updateNodeData, addNodes, addEdges, getNode, getNodes, getEdges } =
    useReactFlow();
  const label = data.label ?? "Scene";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Close dropdown when node loses selection
  useEffect(() => {
    if (!selected) setOpenMenu(null);
  }, [selected]);

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

  function addContentNode(category: ContentCategory, option: string) {
    const self = getNode(id);
    if (!self) return;
    const newId = `content-${Date.now()}`;
    const nodeWidth = self.measured?.width ?? 200;
    // Stack content nodes vertically to the right of this scene
    const connectedCount = getEdges().filter((e) => e.source === id && e.id.startsWith("ce-")).length;
    addNodes({
      id: newId,
      type: "content",
      position: {
        x: self.position.x + nodeWidth + 60,
        y: self.position.y + connectedCount * 52,
      },
      data: { category, option },
    });
    addEdges({
      id: `ce-${id}-${newId}`,
      source: id,
      target: newId,
      sourceHandle: "right",
      targetHandle: "left",
    });
    setOpenMenu(null);
  }

  function addVideoAnalysis() {
    const self = getNode(id);
    if (!self) return;
    const newId = `videoDrop-${Date.now()}`;
    const nodeWidth = self.measured?.width ?? 200;
    const connectedCount = getEdges().filter((e) => e.source === id).length;
    addNodes({
      id: newId,
      type: "videoDrop",
      position: {
        x: self.position.x + nodeWidth + 60,
        y: self.position.y + connectedCount * 52,
      },
      data: { status: "idle" },
    });
    addEdges({
      id: `ve-${id}-${newId}`,
      source: id,
      target: newId,
      sourceHandle: "right",
      targetHandle: "left",
    });
  }

  function handleToolbarClick(item: ToolbarItem) {
    if (item.id === "scene") {
      addScene();
      return;
    }
    if (item.id === "videoAnalysis") {
      addVideoAnalysis();
      return;
    }
    setOpenMenu((prev) => (prev === item.id ? null : item.id));
  }

  const showToolbar = selected || openMenu !== null;

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

      {/* Dark card */}
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

      {/* + button + quick-add toolbar */}
      <div
        className={[
          "nodrag nopan absolute left-1/2 top-full -translate-x-1/2 pt-2 flex flex-col items-center gap-2 transition-all",
          showToolbar
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      >
        {/* + (add scene) */}
        <button
          type="button"
          onClick={addScene}
          aria-label="Add next scene"
          className={[
            "grid h-7 w-7 place-items-center rounded-full",
            "border border-gray-300 bg-white text-gray-500 shadow-sm",
            "transition-all hover:border-gray-900 hover:text-gray-900",
            showToolbar
              ? "scale-100"
              : "scale-90 group-hover:scale-100",
          ].join(" ")}
        >
          <Plus size={14} />
        </button>

        {/* Icon toolbar */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl shadow-sm px-2 py-1.5">
          {TOOLBAR_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                title={item.label}
                onClick={() => handleToolbarClick(item)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  openMenu === item.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                ].join(" ")}
              >
                <item.icon size={17} />
              </button>

              {/* Dropdown options */}
              {openMenu === item.id && item.type === "menu" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
                  {item.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => addContentNode(item.category, opt)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-gray-50 font-medium transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
