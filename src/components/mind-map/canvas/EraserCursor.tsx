"use client";

interface Props {
  isActive: boolean;
  pos: { x: number; y: number } | null;
}

export function EraserCursor({ isActive, pos }: Props) {
  if (!isActive || !pos) return null;
  return (
    <div
      className="pointer-events-none fixed z-[9999] rounded-full border border-red-400/60 bg-red-100/20"
      style={{ width: 40, height: 40, left: pos.x - 20, top: pos.y - 20 }}
    />
  );
}
