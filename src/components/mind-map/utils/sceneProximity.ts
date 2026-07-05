// Scene-proximity math — pure, framework-free.
// Translates scene-connection-spec.md §3 (Voronoi-relative glow) into code.

export interface Pt {
  x: number;
  y: number;
}

// Perimeters are proportional to each scene's size (half-diagonal × multiplier),
// so they scale as a scene is resized. Tuning knobs:
export const CONNECT_MULT = 1.5; // link threshold + visible box radius
export const DETECT_MULT = 3.25; // guidance trigger (must be > CONNECT_MULT)

/** Base perimeter unit for a scene: half its bounding-box diagonal. */
export function sceneRadius(w: number, h: number): number {
  return 0.5 * Math.hypot(w, h);
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Distance from point to the nearest point on/in rect (0 when point is inside
// rect). Standard technique: clamp the point into the rect's bounds, then
// measure distance to that clamped point. Used as the *detection* metric
// itself (not just the final link check) — a rect's edge can be well inside a
// perimeter while its center point is still outside it (e.g. a wide node), so
// every distance calc against a dragged node must use its full box, not its
// center point alone.
export function rectDistance(rect: Rect, point: Pt): number {
  const closest: Pt = {
    x: Math.min(Math.max(point.x, rect.x), rect.x + rect.w),
    y: Math.min(Math.max(point.y, rect.y), rect.y + rect.h),
  };
  return distance(closest, point);
}

export interface SceneRef {
  id: string;
  center: Pt;
  label: string;
  /** Base half-diagonal of the scene card (multiplied for the perimeters). */
  radius: number;
}

export interface SceneZone {
  sceneId: string;
  center: Pt;
  label: string;
  /** 0..1 eased proximity intensity (drives glow opacity/core). */
  glow: number;
  /** Nearest-point-on-block-to-scene-center distance (for the connect check). */
  distance: number;
  /** This scene's connect perimeter radius (link threshold + visible box). */
  connectRadius: number;
}

// Nearest scene whose own detect perimeter contains the block, with
// Voronoi-relative glow. Distance is measured from the block's full bounding
// box (rectDistance), not just its center point, so a wide/tall block is
// detected as soon as any part of it enters a perimeter. Returns null when no
// scene is in range.
export function activeSceneZone(
  blockRect: Rect,
  scenes: SceneRef[],
): SceneZone | null {
  let nearest: SceneRef | null = null;
  let di = Number.POSITIVE_INFINITY;
  for (const s of scenes) {
    const d = rectDistance(blockRect, s.center);
    if (d < di) {
      di = d;
      nearest = s;
    }
  }
  if (!nearest) return null;

  const detectRadius = nearest.radius * DETECT_MULT;
  if (di > detectRadius) return null;

  // Distance to the nearest OTHER scene → Voronoi ratio (spec §3).
  let dMinOther = Number.POSITIVE_INFINITY;
  for (const s of scenes) {
    if (s.id === nearest.id) continue;
    const d = rectDistance(blockRect, s.center);
    if (d < dMinOther) dMinOther = d;
  }

  // Single scene ⇒ no neighbor ⇒ r = 0 (full voronoiIntensity).
  const r = dMinOther === Number.POSITIVE_INFINITY ? 0 : di / (di + dMinOther);
  const voronoiIntensity = clamp01(1 - 2 * r);
  const distanceFactor = clamp01(1 - di / detectRadius);
  const raw = voronoiIntensity * distanceFactor;
  const glow = raw ** 0.45; // eased so mid-range still reads strongly

  return {
    sceneId: nearest.id,
    center: nearest.center,
    label: nearest.label,
    glow,
    distance: di,
    connectRadius: nearest.radius * CONNECT_MULT,
  };
}
