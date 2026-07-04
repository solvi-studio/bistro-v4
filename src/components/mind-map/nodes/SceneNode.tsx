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
import { useEffect, useState } from "react";
import {
  CATEGORY_THEME,
  type ContentCategory,
  categoryOptions,
} from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";
import { pickHandles } from "@/utils/mind-map-handles";
import { placeNode, rectOf } from "@/utils/mind-map-layout";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Toolbar config ───────────────────────────────────────────────────────────

type DirectItem = {
  id: "scene" | "videoAnalysis";
  icon: React.ElementType;
  label: string;
  type: "direct";
};

type MenuCategory = ContentCategory;

type MenuCategoryItem = {
  id: MenuCategory;
  icon: React.ElementType;
  label: string;
  type: "menu";
};

type ToolbarItem = DirectItem | MenuCategoryItem;

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: "scene", icon: Clapperboard, label: "Add Scene", type: "direct" },
  { id: "visual", icon: Image, label: "Add Visual", type: "menu" },
  { id: "audio", icon: Headphones, label: "Add Audio", type: "menu" },
  { id: "script", icon: ClipboardEdit, label: "Add Script", type: "menu" },
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
  const { addNodes, addEdges, getNode, getNodes, getEdges } = useReactFlow();
  const label = data.label ?? "Scene";

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Close dropdown when node loses selection
  useEffect(() => {
    if (!selected) setOpenMenu(null);
  }, [selected]);

  // ── Add next scene only if this scene has no direct successor ────────────────
  function addScene() {
    const self = getNode(id);
    if (!self) return;

    const currentEdges = getEdges();

    // If this scene already has an outgoing sceneEdge, do nothing.
    const alreadyHasSuccessor = currentEdges.some(
      (e) => e.type === "sceneEdge" && e.source === id,
    );
    if (alreadyHasSuccessor) return;

    const sceneCount = getNodes().filter((n) => n.type === "scene").length;
    const newId = `scene-${Date.now()}`;
    const y = self.position.y + (self.measured?.height ?? 52) + 80;

    addNodes({
      id: newId,
      type: "scene",
      position: { x: self.position.x, y },
      data: { label: `Scene ${sceneCount + 1}` },
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

  // ── Add a content node to the right of this scene ────────────────────────────
  function addContentNode(category: ContentCategory, header: string) {
    const self = getNode(id);
    if (!self) return;
    const newId = `content-${Date.now()}`;

    // Estimated card size (before RF measures it).
    const CARD_W = 200;
    const CARD_H = 96;

    const selfW = self.measured?.width ?? 200;
    const selfH = self.measured?.height ?? 52;
    const anchorX = self.position.x + selfW + 48;
    const anchorY = self.position.y + selfH / 2 - CARD_H / 2;

    const occupied = getNodes().map(rectOf);
    const pos = placeNode(occupied, anchorX, anchorY, 1, CARD_W, CARD_H);

    const nodeData: ContentNodeData = {
      category,
      header,
      body: "",
      fontSize: 14,
      width: CARD_W,
    };

    addNodes({ id: newId, type: "content", position: pos, data: nodeData });

    const handles = pickHandles(self, {
      position: pos,
      width: CARD_W,
      height: CARD_H,
    });
    addEdges({
      id: `ce-${id}-${newId}`,
      source: id,
      target: newId,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: "labeled",
      data: { arrowEnd: true },
      markerEnd: EDGE_MARKER,
    });

    setOpenMenu(null);
  }

  function addVideoAnalysis() {
    const self = getNode(id);
    if (!self) return;
    const newId = `videoDrop-${Date.now()}`;

    // VideoNode root is w-70 (280px) and roughly 380px tall once rendered.
    const VIDEO_W = 280;
    const VIDEO_H = 380;

    const selfW = self.measured?.width ?? 200;
    const selfH = self.measured?.height ?? 52;
    const anchorX = self.position.x + selfW + 48;
    const anchorY = self.position.y + selfH / 2 - VIDEO_H / 2;

    const occupied = getNodes().map(rectOf);
    const pos = placeNode(occupied, anchorX, anchorY, 1, VIDEO_W, VIDEO_H);

    addNodes({
      id: newId,
      type: "videoDrop",
      position: pos,
      data: { status: "idle" },
    });
    const handles = pickHandles(self, {
      position: pos,
      width: VIDEO_W,
      height: VIDEO_H,
    });
    addEdges({
      id: `ve-${id}-${newId}`,
      source: id,
      target: newId,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: "labeled",
      data: { arrowEnd: true },
      markerEnd: EDGE_MARKER,
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

      {/* Dark card — label is read-only */}
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-white">
        <span className="block w-full text-center font-semibold select-none">
          {label}
        </span>
      </div>

      {/* + button + quick-add toolbar */}
      <div
        className={[
          "nodrag nopan absolute left-1/2 top-full -translate-x-1/2 pt-2 flex flex-col items-center gap-2 transition-all",
          showToolbar ? "opacity-100" : "opacity-0 group-hover:opacity-100",
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
            showToolbar ? "scale-100" : "scale-90 group-hover:scale-100",
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
                  {categoryOptions(item.id as ContentCategory).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        addContentNode(item.id as ContentCategory, opt)
                      }
                      className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                      style={{
                        color:
                          CATEGORY_THEME[item.id as ContentCategory].headerText,
                      }}
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
