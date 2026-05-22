"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

interface Props {
  left: ReactNode;
  right: ReactNode;
}

// Left-panel sizes the handle soft-snaps to when a drag ends nearby.
const SNAP_POINTS = [30, 50];
const SNAP_THRESHOLD = 7;

export default function ResizableSplit({ left, right }: Props) {
  const leftRef = useRef<ImperativePanelHandle>(null);
  const [collapsed, setCollapsed] = useState(false);

  function handleDragging(isDragging: boolean) {
    if (isDragging) return; // only act when the drag ends
    const panel = leftRef.current;
    if (!panel || panel.isCollapsed()) return;
    const current = panel.getSize();
    const near = SNAP_POINTS.find(
      (p) => Math.abs(p - current) <= SNAP_THRESHOLD,
    );
    if (near != null) panel.resize(near);
  }

  function toggleCollapse() {
    const panel = leftRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }

  return (
    <div className="relative h-full w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel
          ref={leftRef}
          collapsible
          collapsedSize={0}
          defaultSize={30}
          minSize={15}
          maxSize={50}
          onCollapse={() => setCollapsed(true)}
          onExpand={() => setCollapsed(false)}
          className="overflow-hidden"
        >
          {left}
        </Panel>

        <PanelResizeHandle
          onDragging={handleDragging}
          className="group relative w-1.5 bg-gray-100 transition-colors data-[resize-handle-state=drag]:bg-[var(--color-primary)] data-[resize-handle-state=hover]:bg-blue-200"
        >
          <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
        </PanelResizeHandle>

        <Panel className="relative">{right}</Panel>
      </PanelGroup>

      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={toggleCollapse}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        className="absolute left-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </div>
  );
}
