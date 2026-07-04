"use client";

import { PanelLeftOpen } from "lucide-react";
import { createContext, type ReactNode, useRef, useState } from "react";
import {
  type PanelImperativeHandle,
  Panel,
  Group,
  Separator,
} from "react-resizable-panels";

interface Props {
  left: ReactNode;
  right: ReactNode;
}

// Lets the left-panel content (the embedded Creative Helper) render its own
// collapse button in its header, instead of a floating absolute button.
export const SplitContext = createContext<{ collapse: () => void } | null>(
  null,
);

// Left-panel sizes the handle soft-snaps to when a drag ends nearby.
const SNAP_POINTS = [30, 50];
const SNAP_THRESHOLD = 7;

export default function ResizableSplit({ left, right }: Props) {
  const leftRef = useRef<PanelImperativeHandle>(null);
  const [collapsed, setCollapsed] = useState(false);

  function handleLayoutChanged() {
    const panel = leftRef.current;
    if (!panel || panel.isCollapsed()) return;
    const current = panel.getSize().asPercentage;
    const near = SNAP_POINTS.find(
      (p) => Math.abs(p - current) <= SNAP_THRESHOLD,
    );
    if (near != null && Math.abs(current - near) > 0.01)
      panel.resize(`${near}%`);
  }

  function toggleCollapse() {
    const panel = leftRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }

  return (
    <SplitContext.Provider value={{ collapse: toggleCollapse }}>
      <div className="relative h-full w-full">
        <Group
          orientation="horizontal"
          className="h-full"
          onLayoutChanged={handleLayoutChanged}
        >
          <Panel
            panelRef={leftRef}
            collapsible
            collapsedSize="0%"
            defaultSize="30%"
            minSize="15%"
            maxSize="50%"
            onResize={(panelSize) => setCollapsed(panelSize.asPercentage === 0)}
            className="overflow-hidden"
          >
            {left}
          </Panel>

          <Separator className="group relative w-1.5 bg-gray-100 transition-colors data-[separator=active]:bg-primary data-[separator=hover]:bg-blue-200">
            <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
          </Separator>

          <Panel className="relative">{right}</Panel>
        </Group>

        {/* Expand tab — only when collapsed (panel hidden, so the helper's own
            header button isn't reachable). No overlap then. */}
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Expand panel"
            className="absolute left-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>
    </SplitContext.Provider>
  );
}
