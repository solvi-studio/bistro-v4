import type { Node } from "@xyflow/react";

// Collision-aware placement for spawned mind-map nodes.
//
// Every spawn goes through placeNode() / distributeGrid(), which test real
// bounding boxes and return the first non-overlapping slot.  Manual drags can
// still produce overlaps (intentional user action) — only placement-time
// spawns are governed here.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Sizing defaults ──────────────────────────────────────────────────────────
// Conservative fallbacks for nodes that haven't been measured by RF yet.
// Content nodes are 64–175+ px tall; 96 undershoots less than the old 40.
const DEFAULT_W = 200;
const DEFAULT_H = 96;

// Minimum empty space kept between two boxes (bumped from 14 for more breathing
// room, matching the ui-ux spacing-scale).
const GAP = 28;

// ── Node sizing ───────────────────────────────────────────────────────────────
// Single source of truth: prefer React Flow's measured size, then explicit
// node-level width/height, then data.width / data.minHeight (content nodes
// store their size there), then fall back to defaults.
function nodeSize(node: Node): { w: number; h: number } {
  const data = (node.data ?? {}) as Record<string, unknown>;
  // node.width / node.height can be null (RF stores null when unset).
  // ?? already treats null as nullish, so null falls through to data.* → default.
  return {
    w:
      node.measured?.width ??
      node.width ??
      (typeof data.width === "number" ? data.width : undefined) ??
      DEFAULT_W,
    h:
      node.measured?.height ??
      node.height ??
      (typeof data.minHeight === "number" ? data.minHeight : undefined) ??
      DEFAULT_H,
  };
}

export function rectOf(node: Node): Rect {
  const { w, h } = nodeSize(node);
  return { x: node.position.x, y: node.position.y, w, h };
}

// ── Collision test ────────────────────────────────────────────────────────────

function intersects(a: Rect, b: Rect, gap = GAP): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

/**
 * Find a free top-left position near (baseX, baseY) for a box of size (w, h).
 *
 * Scans column by column (stepping outward along `dirX`, so leaves stay on the
 * hub's side), and within each column scans rows outward from the base row
 * (0, +1, -1, +2, …). Returns the first candidate that clears every rect in
 * `occupied`. Falls back to the base position if nothing is free within range.
 */
export function findFreePosition(
  occupied: Rect[],
  baseX: number,
  baseY: number,
  dirX: -1 | 1,
  w = DEFAULT_W,
  h = DEFAULT_H,
): { x: number; y: number } {
  const colStep = (w + GAP) * dirX;
  const rowStep = h + GAP;

  // Wider search than before (10 cols × 24 rows) so crowded canvases still
  // find a clear slot before falling back to the base position.
  for (let col = 0; col < 10; col++) {
    const x = baseX + col * colStep;
    for (let row = 0; row < 24; row++) {
      const dy =
        row === 0
          ? 0
          : (row % 2 === 1 ? Math.ceil(row / 2) : -Math.ceil(row / 2)) *
            rowStep;
      const candidate: Rect = { x, y: baseY + dy, w, h };
      if (!occupied.some((r) => intersects(candidate, r))) {
        return { x: candidate.x, y: candidate.y };
      }
    }
  }
  return { x: baseX, y: baseY };
}

/**
 * Place a single node near (anchorX, anchorY), register it into `occupied`,
 * and return its position.
 *
 * This is the one-shot version of the loop inside distributeGrid. Use it for
 * menu adds (SceneNode) and cursor-drop nudging (spawnContentNode / onDrop).
 * Because it mutates `occupied`, multiple sequential calls within the same
 * event handler each see previously placed nodes, preventing them from
 * overlapping each other.
 */
export function placeNode(
  occupied: Rect[],
  anchorX: number,
  anchorY: number,
  dir: -1 | 1,
  w = DEFAULT_W,
  h = DEFAULT_H,
): { x: number; y: number } {
  const pos = findFreePosition(occupied, anchorX, anchorY, dir, w, h);
  occupied.push({ x: pos.x, y: pos.y, w, h });
  return pos;
}

/**
 * Lay `count` items in a row-major grid anchored at (`baseX`, `baseY`).
 *
 * Columns advance in the `dir` direction (1 = rightward, -1 = leftward).
 * `baseX` must already account for cell width when `dir = -1` so that col 0
 * sits immediately adjacent to the hub on its left.
 *
 * Each slot runs through `findFreePosition` for collision avoidance, then
 * pushes itself into `occupied` so subsequent cells in the same batch don't
 * overlap one another.
 */
export function distributeGrid(
  baseX: number,
  baseY: number,
  count: number,
  occupied: Rect[],
  opts: {
    cols?: number;
    cellW?: number;
    cellH?: number;
    gap?: number;
    dir?: -1 | 1;
  } = {},
): { x: number; y: number }[] {
  if (count <= 0) return [];

  const cols = opts.cols ?? 2;
  const cellW = opts.cellW ?? 260;
  const cellH = opts.cellH ?? 175;
  const gap = opts.gap ?? GAP;
  const dir = opts.dir ?? 1;

  const colStep = (cellW + gap) * dir;
  const rowStep = cellH + gap;

  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const slotX = baseX + col * colStep;
    const slotY = baseY + row * rowStep;
    const pos = findFreePosition(occupied, slotX, slotY, dir, cellW, cellH);
    positions.push(pos);
    occupied.push({ x: pos.x, y: pos.y, w: cellW, h: cellH });
  }
  return positions;
}
