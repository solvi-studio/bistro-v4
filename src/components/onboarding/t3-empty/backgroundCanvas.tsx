"use client";

import { useEffect, useRef } from "react";
import BackgroundSketch from "./BackgroundSketch";

export default function BackgroundCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<BackgroundSketch | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    // same usage as before; constructor starts the loop
    sketchRef.current = new BackgroundSketch({ dom: hostRef.current });

    return () => {
      sketchRef.current?.stop();
      sketchRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
