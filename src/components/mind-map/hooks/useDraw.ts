"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTool } from "@/components/mind-map/context/ToolContext";

export type DrawPoint = [number, number, number]; // [x, y, pressure]

export interface UseDrawReturn {
  isDrawActive: boolean;
  livePoints: DrawPoint[];
  onPointerDown: (e: React.PointerEvent) => void;
}

export function useDraw(): UseDrawReturn {
  const { activeTool } = useTool();
  const { screenToFlowPosition, addNodes } = useReactFlow();
  const isDrawActive = activeTool === "draw";

  const isDrawingRef = useRef(false);
  const currentPtsRef = useRef<DrawPoint[]>([]);
  const [livePoints, setLivePoints] = useState<DrawPoint[]>([]);

  // commitStroke in a ref so window listeners always see fresh screenToFlowPosition / addNodes
  const commitRef = useRef<() => void>(() => {});
  commitRef.current = () => {
    isDrawingRef.current = false;
    const pts = currentPtsRef.current;

    if (pts.length < 2) {
      currentPtsRef.current = [];
      setLivePoints([]);
      return;
    }

    const flowPts = pts.map(([x, y, p]) => {
      const fp = screenToFlowPosition({ x, y });
      return [fp.x, fp.y, p] as DrawPoint;
    });

    const xs = flowPts.map((p) => p[0]);
    const ys = flowPts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pad = 8;

    const relPts: DrawPoint[] = flowPts.map(([x, y, p]) => [
      x - minX + pad,
      y - minY + pad,
      p,
    ]);

    addNodes({
      id: `drawing-${Date.now()}`,
      type: "drawing",
      position: { x: minX - pad, y: minY - pad },
      data: { points: relPts, color: "#1a1a1a", size: 4 },
      style: { width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 },
      selectable: true,
      draggable: true,
    });

    currentPtsRef.current = [];
    setLivePoints([]);
  };

  useEffect(() => {
    if (!isDrawActive) {
      isDrawingRef.current = false;
      currentPtsRef.current = [];
      setLivePoints([]);
      return;
    }

    const onMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      const pt: DrawPoint = [e.clientX, e.clientY, e.pressure];
      currentPtsRef.current = [...currentPtsRef.current, pt];
      setLivePoints(currentPtsRef.current);
    };

    const onUp = () => {
      if (!isDrawingRef.current) return;
      commitRef.current();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDrawActive]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawActive) return;
      if ((e.target as Element).closest(".react-flow__node, .react-flow__edge"))
        return;
      isDrawingRef.current = true;
      const pt: DrawPoint = [e.clientX, e.clientY, e.pressure];
      currentPtsRef.current = [pt];
      setLivePoints([pt]);
    },
    [isDrawActive],
  );

  return { isDrawActive, livePoints, onPointerDown };
}
