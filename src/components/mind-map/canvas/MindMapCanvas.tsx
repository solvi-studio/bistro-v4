"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type OnConnect,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useOnViewportChange,
  useReactFlow,
} from "@xyflow/react";
import { Bot, Download, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  applyColorToNode,
  getNodeThemeColor,
} from "@/components/mind-map/utils/nodeColors";
import {
  exportMindMapForAI,
  exportMindMapGraph,
  exportMindMapJSON,
} from "@/utils/mindmap-export";
import { submitMindMap } from "@/utils/summarise-service";
import "@xyflow/react/dist/style.css";

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
import { useEraser } from "@/components/mind-map/hooks/useEraser";
import { useKeyboardShortcuts } from "@/components/mind-map/hooks/useKeyboardShortcuts";
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
  video: "crosshair",
};

// Class applied to the node currently underneath a dragged node.
const DROP_TARGET_CLASS = "mm-drop-target";

function setNodeHighlight(nodeId: string | null) {
  for (const el of document.querySelectorAll(
    `.react-flow__node.${DROP_TARGET_CLASS}`,
  )) {
    el.classList.remove(DROP_TARGET_CLASS);
  }
  if (nodeId) {
    document
      .querySelector(`.react-flow__node[data-id="${nodeId}"]`)
      ?.classList.add(DROP_TARGET_CLASS);
  }
}

// ─── Inner canvas (must be inside ReactFlowProvider) ─────────────────────────

function CanvasInner() {
  const { activeTool, setActiveTool, pendingShape } = useTool();
  const {
    screenToFlowPosition,
    deleteElements,
    getNodes,
    getEdges,
    addNodes,
    getViewport,
    getIntersectingNodes,
  } = useReactFlow();
  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  // Id of the node a dragged node is currently hovering over (drop target).
  const dropTargetRef = useRef<string | null>(null);

  const isSelectTool = activeTool === "select";

  const { isEraserActive, eraserPos, handlers: eraserHandlers } = useEraser();

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

  // ── Hover-to-connect — drag a node onto another to auto-link them ──────────
  const firstIntersectingId = useCallback(
    (node: Node): string | null => {
      const hit = getIntersectingNodes(node, true).find(
        (n) => n.id !== node.id,
      );
      return hit?.id ?? null;
    },
    [getIntersectingNodes],
  );

  const onNodeDrag: OnNodeDrag = useCallback(
    (_e, node) => {
      const targetId = firstIntersectingId(node);
      if (targetId !== dropTargetRef.current) {
        dropTargetRef.current = targetId;
        setNodeHighlight(targetId);
      }
    },
    [firstIntersectingId],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, node) => {
      const targetId = dropTargetRef.current;
      dropTargetRef.current = null;
      setNodeHighlight(null);
      if (!targetId) return;

      const target = getNodes().find((n) => n.id === targetId);
      if (!target) return;

      // Skip if these two are already linked (either direction).
      const alreadyLinked = getEdges().some(
        (e) =>
          (e.source === target.id && e.target === node.id) ||
          (e.source === node.id && e.target === target.id),
      );
      if (!alreadyLinked) {
        setEdges((eds) =>
          addEdge(
            {
              id: `e-${target.id}-${node.id}`,
              source: target.id,
              target: node.id,
              type: "labeled",
              data: { arrowEnd: true },
              markerEnd: EDGE_MARKER,
            },
            eds,
          ),
        );
      }

      // Dragged node adopts the color of the node it landed on.
      const palette = getNodeThemeColor(target);
      setNodes((ns) =>
        ns.map((n) => {
          if (n.id !== node.id) return n;
          const patch = applyColorToNode(n, palette);
          return {
            ...n,
            ...patch,
            data: { ...n.data, ...(patch.data ?? {}) },
            style: { ...n.style, ...(patch.style ?? {}) },
          };
        }),
      );
    },
    [getNodes, getEdges, setEdges, setNodes],
  );

  // ── Finalise — export graph, submit to backend, go to summarise ────────────
  const handleFinalise = useCallback(() => {
    submitMindMap(exportMindMapGraph(nodes, edges));
    router.push("/summarise");
  }, [nodes, edges, router]);

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

      if (activeTool === "video") {
        addNodes({
          id: `videoDrop-${Date.now()}`,
          type: "videoDrop",
          position,
          data: { status: "idle" },
        });
        setActiveTool("select");
      }
    },
    [activeTool, pendingShape, screenToFlowPosition, addNodes, setActiveTool],
  );

  return (
    <div
      className="w-full h-full relative"
      style={{ cursor: isEraserActive ? "none" : CURSOR[activeTool] }}
      onPointerDown={eraserHandlers.onPointerDown}
      onPointerUp={eraserHandlers.onPointerUp}
      onPointerLeave={eraserHandlers.onPointerLeave}
    >
      <div className="absolute top-3 right-3 z-10 flex gap-2 pointer-events-auto">
        <button
          type="button"
          title="Export JSON"
          onClick={() => exportMindMapJSON(nodes, edges, getViewport())}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Download size={14} /> Export
        </button>
        <button
          type="button"
          title="Export for AI analysis"
          onClick={() => exportMindMapForAI(nodes, edges)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Bot size={14} /> AI Export
        </button>
        <button
          type="button"
          title="Finalise idea and generate summary"
          onClick={handleFinalise}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Sparkles size={14} /> Finalise
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
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
    shape: "Shape",
    connector: "Connector",
    eraser: "Eraser",
    video: "Storyboard / Video",
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
