"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { ShapeType } from "@/components/mind-map/nodes/ShapeNode";

export type Tool =
  | "select"
  | "sticky"
  | "textbox"
  | "shape"
  | "connector"
  | "eraser"
  | "draw";

type ToolContextValue = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  pendingShape: ShapeType;
  setPendingShape: (shape: ShapeType) => void;
};

const ToolContext = createContext<ToolContextValue | null>(null);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveToolState] = useState<Tool>("select");
  const [pendingShape, setPendingShapeState] = useState<ShapeType>("rectangle");

  const setActiveTool = useCallback((tool: Tool) => {
    setActiveToolState(tool);
  }, []);

  const setPendingShape = useCallback((shape: ShapeType) => {
    setPendingShapeState(shape);
  }, []);

  return (
    <ToolContext.Provider
      value={{ activeTool, setActiveTool, pendingShape, setPendingShape }}
    >
      {children}
    </ToolContext.Provider>
  );
}

export function useTool() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTool must be used inside ToolProvider");
  return ctx;
}
