"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type OnConnect,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useOnViewportChange,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import { getStroke } from "perfect-freehand";
import { EraserCursor } from "@/components/mind-map/canvas/EraserCursor";
import MindMapSidePanel from "@/components/mind-map/canvas/MindMapSidePanel";
import ResizableSplit from "@/components/mind-map/canvas/ResizableSplit";
import Toolbar from "@/components/mind-map/canvas/Toolbar";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
} from "@/components/mind-map/constants/initialData";
import {
  type Tool,
  ToolProvider,
  useTool,
} from "@/components/mind-map/context/ToolContext";
import { EDGE_MARKER, edgeTypes } from "@/components/mind-map/edges/edgeTypes";
import { useDraw } from "@/components/mind-map/hooks/useDraw";
import { useEraser } from "@/components/mind-map/hooks/useEraser";
import { useKeyboardShortcuts } from "@/components/mind-map/hooks/useKeyboardShortcuts";
import { getSvgPathFromStroke } from "@/components/mind-map/nodes/DrawingNode";
import { nodeTypes } from "@/components/mind-map/nodes/nodeTypes";
import { DEFAULT_DIMS } from "@/components/mind-map/nodes/ShapeNode";

// ─── Cursor map per tool ──────────────────────────────────────────────────────

const CURSOR: Record<Tool, string> = {
  select: "default",
  sticky: "crosshair",
  textbox: "text",
  shape: "crosshair",
  connector: "crosshair",
  eraser: "none",
  draw: "crosshair",
};

// ─── Inner canvas (must be inside ReactFlowProvider) ─────────────────────────

function CanvasInner() {
  const { activeTool, setActiveTool, pendingShape } = useTool();
  const { screenToFlowPosition, deleteElements, getNodes, getEdges, addNodes } =
    useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  const isSelectTool = activeTool === "select";

  const { isEraserActive, eraserPos, handlers: eraserHandlers } = useEraser();
  const {
    isDrawActive,
    livePoints,
    onPointerDown: drawPointerDown,
  } = useDraw();

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

  useKeyboardShortcuts({
    setActiveTool,
    deleteElements,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
  });

  // ── Edge connection (connector tool only) ──────────────────────────────────
  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (connection.source === connection.target) return false;
      return !getEdges().some(
        (e) => e.source === connection.source && e.target === connection.target,
      );
    },
    [getEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (activeTool !== "connector") return;
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "labeled",
            data: { arrowEnd: true },
            markerEnd: EDGE_MARKER,
          },
          eds,
        ),
      );
    },
    [activeTool, setEdges],
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

      if (activeTool === "shape") {
        const dims = DEFAULT_DIMS[pendingShape];
        addNodes({
          id: `shape-${Date.now()}`,
          type: "shape",
          position,
          data: {
            text: "",
            shape: pendingShape,
            fillColor: "#ffffff",
            strokeColor: "#94a3b8",
            fontSize: 14,
          },
          style: { width: dims.width, height: dims.height },
        });
        setActiveTool("select");
      }
    },
    [activeTool, pendingShape, screenToFlowPosition, addNodes, setActiveTool],
  );

  const livePath =
    livePoints.length > 1
      ? getSvgPathFromStroke(
          getStroke(livePoints, {
            size: 4,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          }),
        )
      : "";

  return (
    <div
      className="w-full h-full relative"
      style={{ cursor: isEraserActive ? "none" : CURSOR[activeTool] }}
      onPointerDown={(e) => {
        eraserHandlers.onPointerDown();
        drawPointerDown(e);
      }}
      onPointerUp={eraserHandlers.onPointerUp}
      onPointerLeave={eraserHandlers.onPointerLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={onPaneClick}
        onNodeClick={eraserHandlers.onNodeClick}
        onNodeMouseEnter={eraserHandlers.onNodeMouseEnter}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isSelectTool}
        nodesConnectable={activeTool === "connector"}
        elementsSelectable={isSelectTool}
        panOnDrag={isSelectTool || activeTool === "connector"}
        selectionOnDrag={isSelectTool}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
        // fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultViewport={{ x: 250, y: 250, zoom: 1 }}
        minZoom={0.1}
        maxZoom={6}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#e5e7eb"
        />
        <Controls
          className="!border !border-gray-200 !shadow-sm !rounded-xl overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          className="!border !border-gray-200 !shadow-sm !rounded-xl overflow-hidden !transition-opacity !duration-300"
          style={{
            opacity: showMinimap ? 1 : 0,
            pointerEvents: showMinimap ? "auto" : "none",
          }}
          nodeColor="#e5e7eb"
          maskColor="rgba(255,255,255,0.7)"
          zoomable
          pannable
        />
      </ReactFlow>

      <EraserCursor isActive={isEraserActive} pos={eraserPos} />

      {isDrawActive && livePath && (
        <svg className="pointer-events-none fixed inset-0 w-screen h-screen z-[9998]">
          <path d={livePath} fill="#1a1a1a" />
        </svg>
      )}
    </div>
  );
}

// ─── Canvas root (layout shell) ───────────────────────────────────────────────

function ActiveToolBadge() {
  const { activeTool } = useTool();
  const labels: Record<string, string> = {
    select: "Select",
    sticky: "Sticky Note",
    textbox: "Text Box",
    connector: "Connector",
    eraser: "Eraser",
    draw: "Freehand Draw",
  };
  return (
    <span className="text-xs text-gray-400 font-medium">
      {labels[activeTool]}
    </span>
  );
}

function CanvasRoot() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <header className="shrink-0 h-11 border-b border-gray-100 flex items-center px-4 gap-3">
        <span className="text-sm font-semibold text-gray-800 tracking-tight">
          Mind Map
        </span>
        <ActiveToolBadge />
      </header>

      <div className="relative flex-1 overflow-hidden">
        <ReactFlowProvider>
          <ResizableSplit
            left={<MindMapSidePanel />}
            right={
              <>
                <CanvasInner />
                <Toolbar />
              </>
            }
          />
        </ReactFlowProvider>
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
