"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, type NodeMouseHandler } from "@xyflow/react";
import { useTool } from "@/components/mind-map/context/ToolContext";

export interface EraserHandlers {
  onNodeClick: NodeMouseHandler;
  onNodeMouseEnter: NodeMouseHandler;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}

export interface UseEraserReturn {
  isEraserActive: boolean;
  eraserPos: { x: number; y: number } | null;
  handlers: EraserHandlers;
}

export function useEraser(): UseEraserReturn {
  const { activeTool } = useTool();
  const { deleteElements } = useReactFlow();
  const isEraserActive = activeTool === "eraser";
  const isErasingRef = useRef(false);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isEraserActive) {
      setEraserPos(null);
      return;
    }
    const onMove = (e: PointerEvent) => setEraserPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [isEraserActive]);

  useEffect(() => {
    if (!isEraserActive) return;
    const style = document.createElement("style");
    style.id = "__eraser-cursor";
    style.textContent = "* { cursor: none !important; }";
    document.head.appendChild(style);
    return () => document.getElementById("__eraser-cursor")?.remove();
  }, [isEraserActive]);

  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (isEraserActive) deleteElements({ nodes: [node], edges: [] });
  }, [isEraserActive, deleteElements]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_e, node) => {
    if (isEraserActive && isErasingRef.current) deleteElements({ nodes: [node], edges: [] });
  }, [isEraserActive, deleteElements]);

  const handlers: EraserHandlers = {
    onNodeClick,
    onNodeMouseEnter,
    onPointerDown: () => { if (isEraserActive) isErasingRef.current = true; },
    onPointerUp: () => { isErasingRef.current = false; },
    onPointerLeave: () => { isErasingRef.current = false; setEraserPos(null); },
  };

  return { isEraserActive, eraserPos, handlers };
}
