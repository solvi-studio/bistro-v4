// Closest-handle picker — run ONCE when an edge is created.
//
// Given the two nodes being connected, choose the side handle on each that faces
// the other node, and return their handle ids. The edge stores these as
// sourceHandle / targetHandle, so the connection is baked in at creation and
// does NOT recompute as the nodes move afterwards.
//
// Works with any node that exposes side handles with ids "top" | "right" |
// "bottom" | "left" (TopicNode and the custom nodes all do).

export type HandleSide = "top" | "right" | "bottom" | "left";

// Minimal shape we need from a node: its position + size.
export interface NodeBox {
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  measured?: { width?: number; height?: number };
  /** Content nodes persist a user-resized width/height floor here (see
   * ContentNode.tsx's corner-drag handler) — measured/width can lag a resize
   * by a frame or more, so this must be checked as a fallback. */
  data?: { width?: unknown; minHeight?: unknown };
}

// Same precedence as utils/mind-map-layout.ts's nodeSize() — the codebase's
// single source of truth for node sizing — kept in sync with it deliberately:
// measured → node.width/height → data.width/minHeight → 0 (caller's fallback).
function resolveSize(node: NodeBox): { w: number; h: number } {
  const data = node.data ?? {};
  return {
    w:
      node.measured?.width ??
      node.width ??
      (typeof data.width === "number" ? data.width : undefined) ??
      0,
    h:
      node.measured?.height ??
      node.height ??
      (typeof data.minHeight === "number" ? data.minHeight : undefined) ??
      0,
  };
}

export function centerOf(node: NodeBox): { x: number; y: number } {
  const { w, h } = resolveSize(node);
  return { x: node.position.x + w / 2, y: node.position.y + h / 2 };
}

// Measured size of a node (0 when nothing — measured, width/height, or
// data.width/minHeight — is available yet; the caller applies its own
// type-specific fallback).
export function sizeOf(node: NodeBox): { w: number; h: number } {
  return resolveSize(node);
}

export interface PickedHandles {
  sourceHandle: HandleSide;
  targetHandle: HandleSide;
}

// Pick the facing handle on each node based on the dominant axis between centers.
export function pickHandles(source: NodeBox, target: NodeBox): PickedHandles {
  const a = centerOf(source);
  const b = centerOf(target);
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // Horizontal dominant → connect left/right; otherwise top/bottom.
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}
