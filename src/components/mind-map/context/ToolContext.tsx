"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Tool = "select" | "sticky" | "textbox" | "connector" | "eraser" | "draw";

type ToolContextValue = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
};

const ToolContext = createContext<ToolContextValue | null>(null);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveToolState] = useState<Tool>("select");

  const setActiveTool = useCallback((tool: Tool) => {
    setActiveToolState(tool);
  }, []);

  return (
    <ToolContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </ToolContext.Provider>
  );
}

export function useTool() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTool must be used inside ToolProvider");
  return ctx;
}
