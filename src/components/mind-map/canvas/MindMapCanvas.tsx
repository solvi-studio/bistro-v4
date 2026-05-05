"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  OnConnect,
  NodeMouseHandler,
  useReactFlow,
  useOnViewportChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ToolProvider, useTool, Tool } from "@/components/mind-map/context/ToolContext";
import { useKeyboardShortcuts } from "@/components/mind-map/hooks/useKeyboardShortcuts";
import { nodeTypes } from "@/components/mind-map/nodes/nodeTypes";
import { INITIAL_NODES, INITIAL_EDGES } from "@/components/mind-map/constants/initialData";
import Toolbar from "@/components/mind-map/canvas/Toolbar";

// ─── Cursor map per tool ──────────────────────────────────────────────────────

const CURSOR: Record<Tool, string> = {
  select:    "default",
  sticky:    "crosshair",
  textbox:   "text",
  connector: "crosshair",
  eraser:    "cell",
  draw:      "crosshair",
};

// ─── Inner canvas (must be inside ReactFlowProvider) ─────────────────────────

function CanvasInner() {
  const { activeTool, setActiveTool } = useTool();
  const { screenToFlowPosition, deleteElements, getNodes, getEdges, addNodes } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  const isSelectTool = activeTool === "select";

  // ── Minimap visibility — show while panning, hide 1.5s after stopping ────
  const [showMinimap, setShowMinimap] = useState(false);
  const minimapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useOnViewportChange({
    onStart: () => {
      if (minimapTimer.current) clearTimeout(minimapTimer.current);
      setShowMinimap(true);
    },
    onEnd: () => {
      minimapTimer.current = setTimeout(() => setShowMinimap(false), 1500);
    },
  });

  useKeyboardShortcuts({ setActiveTool, deleteElements, getNodes, getEdges, setNodes, setEdges });

  // ── Edge connection (connector tool only) ──────────────────────────────────
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (activeTool !== "connector") return;
      setEdges((eds) =>
        addEdge(
          { ...connection, type: "smoothstep", style: { stroke: "#d1d5db", strokeWidth: 1.5 } },
          eds
        )
      );
    },
    [activeTool, setEdges]
  );

  // ── Pane click — place sticky or textbox ──────────────────────────────────
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (activeTool === "sticky") {
        addNodes({
          id: `sticky-${Date.now()}`,
          type: "sticky",
          position,
          data: { text: "", color: "#fef9c3", fontSize: 14 },
        });
        setActiveTool("select");
      }

      if (activeTool === "textbox") {
        addNodes({
          id: `textbox-${Date.now()}`,
          type: "textbox",
          position,
          data: { html: "", fontSize: "md" },
          style: { width: 200 },
        });
        setActiveTool("select");
      }
    },
    [activeTool, screenToFlowPosition, addNodes, setActiveTool]
  );

  // ── Node click — eraser tool ───────────────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (activeTool === "eraser") {
      deleteElements({ nodes: [node], edges: [] });
    }
  }, [activeTool, deleteElements]);

  return (
    <div className="w-full h-full" style={{ cursor: CURSOR[activeTool] }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={isSelectTool}
        nodesConnectable={activeTool === "connector"}
        elementsSelectable={isSelectTool}
        panOnDrag={isSelectTool || activeTool === "connector"}
        selectionOnDrag={isSelectTool}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#d1d5db", strokeWidth: 1.5 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#e5e7eb" />
        <Controls
          className="!border !border-gray-200 !shadow-sm !rounded-xl overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          className="!border !border-gray-200 !shadow-sm !rounded-xl overflow-hidden !transition-opacity !duration-300"
          style={{ opacity: showMinimap ? 1 : 0, pointerEvents: showMinimap ? "auto" : "none" }}
          nodeColor="#e5e7eb"
          maskColor="rgba(255,255,255,0.7)"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

// ─── Canvas root (layout shell) ───────────────────────────────────────────────

function ActiveToolBadge() {
  const { activeTool } = useTool();
  const labels: Record<string, string> = {
    select:    "Select",
    sticky:    "Sticky Note",
    textbox:   "Text Box",
    connector: "Connector",
    eraser:    "Eraser",
    draw:      "Freehand Draw",
  };
  return <span className="text-xs text-gray-400 font-medium">{labels[activeTool]}</span>;
}

function CanvasRoot() {
  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden">
      <header className="shrink-0 h-11 border-b border-gray-100 flex items-center px-4 gap-3">
        <span className="text-sm font-semibold text-gray-800 tracking-tight">Mind Map</span>
        <ActiveToolBadge />
      </header>

      <div className="relative flex-1 overflow-hidden">
        <ReactFlowProvider>
          <CanvasInner />
        </ReactFlowProvider>
        <Toolbar />
      </div>
    </div>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function MindMapCanvas() {
  return (
    <ToolProvider>
      <CanvasRoot />
    </ToolProvider>
  );
}
