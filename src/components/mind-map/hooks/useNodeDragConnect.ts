"use client";

import {
  addEdge,
  type Edge,
  type Node,
  type OnNodeDrag,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useState } from "react";
import {
  CATEGORY_THEME,
  type ContentCategory,
} from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import {
  activeSceneZone,
  type Rect,
  type SceneRef,
  type SceneZone,
  sceneRadius,
} from "@/components/mind-map/utils/sceneProximity";
import { centerOf, pickHandles, sizeOf } from "@/utils/mind-map-handles";

export const VIDEO_BLOCK_COLOR = "#0f766e"; // videoDrop teal accent (VideoNode header color)

// Glow color for a bare category string — used by both the RF-node-drag path
// (via blockColor, once the node exists) and the sidebar HTML5-drag path
// (which only has the category from the drag MIME type, no node yet).
export function categoryGlowColor(cat: ContentCategory): string {
  return CATEGORY_THEME[cat].headerText;
}

// Fallback size when a node hasn't been measured yet (matches the defaults
// SceneNode.tsx uses when spawning these node types: CARD_W/H and VIDEO_W/H).
function fallbackSize(node: Node): { w: number; h: number } {
  return node.type === "videoDrop" ? { w: 280, h: 380 } : { w: 200, h: 96 };
}

// Full bounding box of a dragged node — proximity detection (activeSceneZone)
// must use this, not just the node's center point, so a wide/tall node is
// detected as soon as any part of it enters a perimeter.
function nodeRectOf(node: Node): Rect {
  const { w, h } = sizeOf(node);
  const fb = fallbackSize(node);
  return {
    x: node.position.x,
    y: node.position.y,
    w: w || fb.w,
    h: h || fb.h,
  };
}

// Color the proximity glow to match the dragged block, per spec §2.
function blockColor(node: Node): string {
  if (node.type === "content") {
    const cat = (node.data as { category?: ContentCategory }).category;
    return cat ? categoryGlowColor(cat) : VIDEO_BLOCK_COLOR;
  }
  return VIDEO_BLOCK_COLOR;
}

// ── Connection direction normalisation ────────────────────────────────────────
// The target here always comes from the scene-proximity zone, so it's always a
// scene; this puts the scene on the source side of the edge.
function normalizeSceneEdge(a: Node, b: Node): { source: Node; target: Node } {
  if (a.type === "scene" && b.type !== "scene") return { source: a, target: b };
  if (b.type === "scene" && a.type !== "scene") return { source: b, target: a };
  return { source: a, target: b };
}

function buildConnectedEdge(
  source: Node,
  target: Node,
  sourceHandle: string | undefined,
  targetHandle: string | undefined,
): Edge {
  const id = `e-${source.id}-${target.id}`;
  if (source.type === "scene" && target.type === "scene") {
    return {
      id,
      source: source.id,
      target: target.id,
      sourceHandle,
      targetHandle,
      type: "sceneEdge" as const,
    };
  }
  return {
    id,
    source: source.id,
    target: target.id,
    sourceHandle,
    targetHandle,
    type: "labeled" as const,
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  };
}

export function useNodeDragConnect({
  setEdges,
}: {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}): {
  onNodeDrag: OnNodeDrag;
  onNodeDragStop: OnNodeDrag;
  proximity: { zone: SceneZone; blockColor: string } | null;
  // External (HTML5) drag support — for a sidebar chip that isn't yet an RF
  // node while it's being dragged. Same proximity state + link logic as the
  // RF-node-drag path above, driven from a cursor-derived rect instead.
  onExternalDragOver: (blockRect: Rect, color: string) => void;
  clearProximity: () => void;
  connectExternalNode: (node: Node, dropRect: Rect) => void;
} {
  const { getNodes, getEdges } = useReactFlow();
  const [proximity, setProximity] = useState<{
    zone: SceneZone;
    blockColor: string;
  } | null>(null);

  const sceneRefs = useCallback((): SceneRef[] => {
    return getNodes()
      .filter((n) => n.type === "scene")
      .map((n) => {
        const { w, h } = sizeOf(n);
        return {
          id: n.id,
          center: centerOf(n),
          label: (n.data as { label?: string }).label ?? "Scene",
          radius: sceneRadius(w || 200, h || 52),
        };
      });
  }, [getNodes]);

  // Scene drags never connect anything (spec §Drag behavior) — only their
  // position updates; docked blocks and connector lines follow automatically
  // because they're derived from the scene's live position on every render.
  // Content/video drags show the scene-proximity glow (utils/sceneProximity.ts).
  const onNodeDrag: OnNodeDrag = useCallback(
    (_e, node) => {
      if (node.type === "scene") {
        setProximity(null);
        return;
      }
      const zone = activeSceneZone(nodeRectOf(node), sceneRefs());
      setProximity(zone ? { zone, blockColor: blockColor(node) } : null);
    },
    [sceneRefs],
  );

  // The ONLY drag-based way to create an edge: a content/video block dropped
  // with any part of its bounding box (edge, corner, or interior) touching its
  // nearest scene's connect radius links to that scene — same rect-aware
  // distance used for detection above, so what triggers the glow is exactly
  // what triggers the link. Scene drags, and content/video dropped near no
  // scene, create no edge — use the "+" toolbar or the connector tool
  // (handle-drag) instead.
  //
  // Shared by both onNodeDragStop (already-placed node re-dragged) and
  // connectExternalNode (sidebar chip just spawned by a drop).
  const linkBlockToNearestScene = useCallback(
    (node: Node, rect?: Rect) => {
      const zone = activeSceneZone(rect ?? nodeRectOf(node), sceneRefs());
      if (!zone || zone.distance > zone.connectRadius) return;

      const sceneNode = getNodes().find((n) => n.id === zone.sceneId);
      if (!sceneNode) return;

      const { source, target } = normalizeSceneEdge(sceneNode, node);

      const alreadyLinked = getEdges().some(
        (e) =>
          (e.source === source.id && e.target === target.id) ||
          (e.source === target.id && e.target === source.id),
      );
      if (alreadyLinked) return;

      const { sourceHandle, targetHandle } = pickHandles(source, target);
      setEdges((eds) =>
        addEdge(
          buildConnectedEdge(source, target, sourceHandle, targetHandle),
          eds,
        ),
      );
    },
    [getNodes, getEdges, setEdges, sceneRefs],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, node) => {
      setProximity(null);
      if (node.type === "scene") return;
      linkBlockToNearestScene(node);
    },
    [linkBlockToNearestScene],
  );

  // Sidebar HTML5 drag — called from onDragOver with a cursor-derived rect
  // (no RF node exists yet), so the guide overlay appears while dragging in,
  // not only after the chip is placed and re-dragged.
  const onExternalDragOver = useCallback(
    (blockRect: Rect, color: string) => {
      const zone = activeSceneZone(blockRect, sceneRefs());
      setProximity(zone ? { zone, blockColor: color } : null);
    },
    [sceneRefs],
  );

  const clearProximity = useCallback(() => setProximity(null), []);

  // Called right after a sidebar-drag drop spawns its node. `dropRect` is the
  // raw cursor-derived rect (same one onExternalDragOver used for the glow) —
  // required, not the node's post-spawn position, because placeNode() may
  // have nudged the node away from a scene it was overlapping, which would
  // otherwise push it outside the connect radius the glow just promised.
  const connectExternalNode = useCallback(
    (node: Node, dropRect: Rect) => linkBlockToNearestScene(node, dropRect),
    [linkBlockToNearestScene],
  );

  return {
    onNodeDrag,
    onNodeDragStop,
    proximity,
    onExternalDragOver,
    clearProximity,
    connectExternalNode,
  };
}
