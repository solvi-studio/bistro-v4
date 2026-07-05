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
  rectTouchesCircle,
  type SceneRef,
  type SceneZone,
  sceneRadius,
} from "@/components/mind-map/utils/sceneProximity";
import { centerOf, pickHandles, sizeOf } from "@/utils/mind-map-handles";

const VIDEO_BLOCK_COLOR = "#0f766e"; // videoDrop teal accent (VideoNode header color)

// Fallback size when a node hasn't been measured yet (matches the defaults
// SceneNode.tsx uses when spawning these node types: CARD_W/H and VIDEO_W/H).
function fallbackSize(node: Node): { w: number; h: number } {
  return node.type === "videoDrop" ? { w: 280, h: 380 } : { w: 200, h: 96 };
}

// Color the proximity glow to match the dragged block, per spec §2.
function blockColor(node: Node): string {
  if (node.type === "content") {
    const cat = (node.data as { category?: ContentCategory }).category;
    return cat ? CATEGORY_THEME[cat].headerText : VIDEO_BLOCK_COLOR;
  }
  return VIDEO_BLOCK_COLOR;
}

// ── Connection direction normalisation ────────────────────────────────────────
// The target here always comes from the scene-proximity zone, so it's always a
// scene; this puts the scene on the source side of the edge.
function normalizeSceneEdge(
  a: Node,
  b: Node,
): { source: Node; target: Node } {
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
      const zone = activeSceneZone(centerOf(node), sceneRefs());
      setProximity(zone ? { zone, blockColor: blockColor(node) } : null);
    },
    [sceneRefs],
  );

  // The ONLY drag-based way to create an edge: a content/video block dropped
  // with any part of its bounding box (edge, corner, or interior) touching its
  // nearest scene's connect radius links to that scene. Scene drags, and
  // content/video dropped near no scene, create no edge — use the "+" toolbar
  // or the connector tool (handle-drag) instead.
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, node) => {
      setProximity(null);
      if (node.type === "scene") return;

      const zone = activeSceneZone(centerOf(node), sceneRefs());
      if (!zone) return;

      const { w, h } = sizeOf(node);
      const fb = fallbackSize(node);
      const rect: Rect = {
        x: node.position.x,
        y: node.position.y,
        w: w || fb.w,
        h: h || fb.h,
      };
      if (!rectTouchesCircle(rect, zone.center, zone.connectRadius)) return;

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

  return { onNodeDrag, onNodeDragStop, proximity };
}
