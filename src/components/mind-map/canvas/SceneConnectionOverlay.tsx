"use client";

import { ViewportPortal } from "@xyflow/react";
import type { SceneZone } from "@/components/mind-map/utils/sceneProximity";

// ─── Hex → rgba (glow fill is tinted to the dragged block's color) ─────────────
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Radial glow tinted to the dragged block, per spec §2.
function glowBackground(color: string, glow: number): string {
  const coreStop = 8 - glow * 5;
  const midStop = 42 - glow * 14;
  const coreAlpha = Math.min(1, 0.22 + glow * 1.18);
  const midAlpha = coreAlpha * 0.6;
  const core = hexToRgba(color, coreAlpha);
  const mid = hexToRgba(color, midAlpha);
  return `radial-gradient(circle at 50% 50%, ${core} ${coreStop}%, ${core} ${coreStop}%, ${mid} ${midStop}%, transparent 78%)`;
}

export default function SceneConnectionOverlay({
  proximity,
}: {
  proximity: { zone: SceneZone; blockColor: string } | null;
}) {
  if (!proximity) return null;
  const { zone, blockColor } = proximity;
  const { center, label, glow, connectRadius } = zone;
  const glowOpacity = Math.min(1, 0.15 + glow * 1.25);

  // Box footprint = the connect perimeter (flow px). Anchor its center on the
  // scene center via translate(-50%,-50%). Everything scales with the scene
  // (bigger scene ⇒ bigger connectRadius) and with zoom (under ViewportPortal).
  const d = connectRadius * 2;
  const radius = d * 0.12;

  return (
    <ViewportPortal>
      <div
        className="pointer-events-none absolute"
        style={{
          left: center.x,
          top: center.y,
          width: d,
          height: d,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Proximity glow — clipped to the box silhouette */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: radius,
            overflow: "hidden",
            opacity: glowOpacity,
            background: glowBackground(blockColor, glow),
          }}
        />

        {/* Connect-zone dashed box */}
        <div
          className="absolute inset-0 animate-[sc-pulse-ring_1.4s_ease-in-out_infinite]"
          style={{
            borderRadius: radius,
            border: `${Math.max(1.5, d * 0.012)}px dashed rgba(23,22,27,0.55)`,
            background: "rgba(255,255,255,0.35)",
            backdropFilter: `blur(${d * 0.02}px)`,
          }}
        />

        {/* Floating label pill below the box */}
        <div
          className="absolute left-1/2 top-full animate-[sc-label-float_1.4s_ease-in-out_infinite] whitespace-nowrap font-poppins font-medium text-white"
          style={{
            marginTop: d * 0.05,
            borderRadius: d * 0.09,
            padding: `${d * 0.035}px ${d * 0.06}px`,
            fontSize: d * 0.06,
            background: "#17161b",
          }}
        >
          {`Drop to connect to ${label}`}
        </div>
      </div>
    </ViewportPortal>
  );
}
