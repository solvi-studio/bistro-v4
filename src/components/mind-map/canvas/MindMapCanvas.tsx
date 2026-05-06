"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Connection,
  useReactFlow,
  useOnViewportChange,
  Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ToolProvider, useTool, Tool } from "@/components/mind-map/context/ToolContext";
import { DEFAULT_DIMS } from "@/components/mind-map/nodes/ShapeNode";
import { useKeyboardShortcuts } from "@/components/mind-map/hooks/useKeyboardShortcuts";
import { useEraser } from "@/components/mind-map/hooks/useEraser";
import { useDraw } from "@/components/mind-map/hooks/useDraw";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "@/components/mind-map/nodes/DrawingNode";
import { nodeTypes } from "@/components/mind-map/nodes/nodeTypes";
import { edgeTypes, EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import { INITIAL_NODES, INITIAL_EDGES } from "@/components/mind-map/constants/initialData";
import Toolbar from "@/components/mind-map/canvas/Toolbar";
import { EraserCursor } from "@/components/mind-map/canvas/EraserCursor";
import {
  useMindMapPersistence,
  loadSavedMap,
} from "@/components/mind-map/hooks/useMindMapPersistence";
import { restoreNodes, restoreEdges } from "@/components/mind-map/lib/mindmap-serializer";

// ─── Cursor map per tool ──────────────────────────────────────────────────────

const CURSOR: Record<Tool, string> = {
  select:    "default",
  sticky:    "crosshair",
  textbox:   "text",
  shape:     "crosshair",
  connector: "crosshair",
  eraser:    "none",
  draw:      "crosshair",
};

const MAP_ID = "default";
const MAP_NAME = "My Map";

// ─── Inner canvas (must be inside ReactFlowProvider) ─────────────────────────

function CanvasInner() {
  const { activeTool, setActiveTool, pendingShape } = useTool();
  const { screenToFlowPosition, deleteElements, getNodes, getEdges, addNodes, setViewport, getViewport } = useReactFlow();

  // Load from localStorage on first render; fall back to demo data
  const [initialData] = useState(() => {
    const saved = loadSavedMap(MAP_ID);
    if (saved) {
      return {
        nodes: restoreNodes(saved.nodes),
        edges: restoreEdges(saved.edges),
        viewport: saved.viewport as Viewport | null,
        createdAt: saved.meta.createdAt,
      };
    }
    return {
      nodes: INITIAL_NODES as Node[],
      edges: INITIAL_EDGES as Edge[],
      viewport: null as Viewport | null,
      createdAt: new Date().toISOString(),
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Restore saved viewport after ReactFlow mounts
  useEffect(() => {
    if (initialData.viewport) {
      setViewport(initialData.viewport);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importFileRef = useRef<HTMLInputElement>(null);

  const onImport = useCallback(
    (restoredNodes: Node[], restoredEdges: Edge[], viewport: Viewport) => {
      setNodes(restoredNodes);
      setEdges(restoredEdges);
      setViewport(viewport);
    },
    [setNodes, setEdges, setViewport]
  );

  const { saveStatus, errorMessage, exportToFile, importFromFile } = useMindMapPersistence({
    mapId: MAP_ID,
    mapName: MAP_NAME,
    nodes,
    edges,
    getViewport,
    onImport,
    createdAt: initialData.createdAt,
  });

  const isSelectTool = activeTool === "select";

  const { isEraserActive, eraserPos, handlers: eraserHandlers } = useEraser();
  const { isDrawActive, livePoints, onPointerDown: drawPointerDown } = useDraw();

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
  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (connection.source === connection.target) return false;
      return !getEdges().some(
        (e) => e.source === connection.source && e.target === connection.target
      );
    },
    [getEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (activeTool !== "connector") return;
      setEdges((eds) =>
        addEdge({ ...connection, type: "labeled", data: { arrowEnd: true }, markerEnd: EDGE_MARKER }, eds)
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

      if (activeTool === "shape") {
        const dims = DEFAULT_DIMS[pendingShape];
        addNodes({
          id: `shape-${Date.now()}`,
          type: "shape",
          position,
          data: { text: "", shape: pendingShape, fillColor: "#ffffff", strokeColor: "#94a3b8", fontSize: 14 },
          style: { width: dims.width, height: dims.height },
        });
        setActiveTool("select");
      }
    },
    [activeTool, pendingShape, screenToFlowPosition, addNodes, setActiveTool]
  );

  const livePath = livePoints.length > 1
    ? getSvgPathFromStroke(getStroke(livePoints, { size: 4, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }))
    : "";

  return (
    <div
      className="w-full h-full relative"
      style={{ cursor: isEraserActive ? "none" : CURSOR[activeTool] }}
      onPointerDown={(e) => { eraserHandlers.onPointerDown(); drawPointerDown(e); }}
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
        fitView={!initialData.viewport}
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
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

      <EraserCursor isActive={isEraserActive} pos={eraserPos} />

      {isDrawActive && livePath && (
        <svg className="pointer-events-none fixed inset-0 w-screen h-screen z-[9998]">
          <path d={livePath} fill="#1a1a1a" />
        </svg>
      )}

      {/* Save status toast */}
      {(saveStatus === "saved" || saveStatus === "error") && (
        <div
          className={[
            "absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl text-xs font-medium shadow-sm border",
            saveStatus === "saved"
              ? "bg-white text-gray-500 border-gray-200"
              : "bg-red-50 text-red-600 border-red-200",
          ].join(" ")}
        >
          {saveStatus === "saved" ? "Saved" : (errorMessage ?? "Save failed")}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json,.mindmap.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFromFile(file);
          e.target.value = "";
        }}
      />

      <Toolbar onExport={exportToFile} onImport={() => importFileRef.current?.click()} />
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
