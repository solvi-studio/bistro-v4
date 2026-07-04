// Standalone assertion script for placement helpers.
// Run: npx tsx scripts/layout.check.ts  (project has no test runner)

import assert from "node:assert/strict";
import {
  distributeGrid,
  findFreePosition,
  placeNode,
  type Rect,
} from "../src/utils/mind-map-layout";

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

const toRect = (p: { x: number; y: number }, w: number, h: number): Rect => ({
  x: p.x,
  y: p.y,
  w,
  h,
});

// ── findFreePosition ──────────────────────────────────────────────────────────

// Returns base when there is nothing in the way.
{
  const pos = findFreePosition([], 100, 200, 1, 200, 96);
  assert.deepEqual(pos, { x: 100, y: 200 }, "free slot at base");
}

// Nudges when base is occupied.
{
  const occupied: Rect[] = [{ x: 100, y: 200, w: 200, h: 96 }];
  const pos = findFreePosition(occupied, 100, 200, 1, 200, 96);
  assert.ok(
    !overlaps(toRect(pos, 200, 96), occupied[0]),
    "nudged off occupied rect",
  );
}

// ── placeNode ─────────────────────────────────────────────────────────────────

// Registers itself into occupied so successive calls don't collide.
{
  const occupied: Rect[] = [];
  const p1 = placeNode(occupied, 100, 200, 1, 200, 96);
  const p2 = placeNode(occupied, 100, 200, 1, 200, 96);
  assert.ok(
    !overlaps(toRect(p1, 200, 96), toRect(p2, 200, 96)),
    "two sequential placeNode calls don't overlap",
  );
  assert.equal(occupied.length, 2, "both rects registered");
}

// ── distributeGrid ─────────────────────────────────────────────────────────────

// No overlaps in a 2-column 5-item grid.
{
  const positions = distributeGrid(0, 0, 5, [], {
    cols: 2,
    cellW: 260,
    cellH: 175,
    gap: 28,
    dir: 1,
  });
  assert.equal(positions.length, 5, "5 positions returned");
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      assert.ok(
        !overlaps(
          toRect(positions[i], 260, 175),
          toRect(positions[j], 260, 175),
        ),
        `no overlap ${i}/${j}`,
      );
    }
  }
}

// Collision with a pre-existing node nudges the first slot.
{
  const blocker: Rect = { x: 0, y: 0, w: 260, h: 175 };
  const positions = distributeGrid(0, 0, 2, [blocker], {
    cols: 2,
    cellW: 260,
    cellH: 175,
    gap: 28,
    dir: 1,
  });
  for (const p of positions) {
    assert.ok(
      !overlaps(toRect(p, 260, 175), blocker),
      "grid slots don't land on pre-existing blocker",
    );
  }
}

// Empty input.
{
  assert.deepEqual(distributeGrid(0, 0, 0, [], {}), [], "count 0 → []");
}

console.log("layout: all assertions passed");
