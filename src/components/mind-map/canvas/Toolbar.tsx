"use client";

import { MousePointer2, StickyNote, Type, Spline, Eraser, PenLine } from "lucide-react";
import { useTool, Tool } from "@/components/mind-map/context/ToolContext";

type ToolDef = {
  tool: Tool;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
};

const TOOLS: ToolDef[] = [
  { tool: "select",    label: "Select",         shortcut: "V", icon: <MousePointer2 size={18} /> },
  { tool: "sticky",    label: "Sticky Note",    shortcut: "S", icon: <StickyNote size={18} /> },
  { tool: "textbox",   label: "Text Box",       shortcut: "T", icon: <Type size={18} /> },
  { tool: "connector", label: "Connector",      shortcut: "C", icon: <Spline size={18} /> },
  { tool: "eraser",    label: "Eraser",         shortcut: "E", icon: <Eraser size={18} /> },
  { tool: "draw",      label: "Freehand Draw",  shortcut: "P", icon: <PenLine size={18} /> },
];

export default function Toolbar() {
  const { activeTool, setActiveTool } = useTool();

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1 bg-white border border-gray-200 rounded-xl shadow-sm p-1.5">
      {TOOLS.map(({ tool, label, shortcut, icon }) => {
        const isActive = activeTool === tool;
        return (
          <button
            key={tool}
            type="button"
            onClick={() => setActiveTool(tool)}
            title={`${label} (${shortcut})`}
            aria-label={label}
            aria-pressed={isActive}
            className={[
              "relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
            ].join(" ")}
          >
            {icon}
            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold leading-none bg-gray-200 text-gray-500 rounded px-0.5 py-px select-none pointer-events-none opacity-70">
              {shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
}
