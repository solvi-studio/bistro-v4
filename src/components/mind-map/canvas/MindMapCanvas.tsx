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
import { Save, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  findGroup,
  spawnTopicNode,
  TOPIC_DND_MIME,
  type TopicDragPayload,
  VIDEO_DND_MIME,
} from "@/components/mind-map/utils/spawnTopic";
import { pickHandles } from "@/utils/mind-map-handles";
import { loadCanvas, saveCanvas } from "@/utils/mind-map-store";
import { exportMindMapGraph } from "@/utils/mindmap-export";
import { submitMindMap } from "@/utils/summarise-service";
import "@xyflow/react/dist/style.css";

import CreativeHelperSidebar from "@/components/creative/CreativeHelperSidebar";
import { EraserCursor } from "@/components/mind-map/canvas/EraserCursor";
import MindMapSidePanel from "@/components/mind-map/canvas/MindMapSidePanel";
import ResizableSplit from "@/components/mind-map/canvas/ResizableSplit";
// import Toolbar from "@/components/mind-map/canvas/Toolbar";
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
import { useNodeDragConnect } from "@/components/mind-map/hooks/useNodeDragConnect";
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
    setViewport,
  } = useReactFlow();
  const router = useRouter();
  const params = useSearchParams();
  // Each idea (script) keeps its own canvas; "default" when opened standalone.
  const mapId = params.get("script") ?? "default";

  // Render the defaults on both server and client (no storage read during
  // render — that would diverge from the SSR HTML and trip hydration).
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  // Restore the saved canvas after mount; persistence is gated on this so we
  // never write the defaults over saved data before it loads.
  const restored = useRef(false);
  useEffect(() => {
    const saved = loadCanvas(mapId);
    if (saved) {
      setNodes(saved.nodes);
      setEdges(saved.edges);
      if (saved.viewport) setViewport(saved.viewport);
    }
    restored.current = true;
  }, [mapId, setNodes, setEdges, setViewport]);

  // Persist canvas changes, debounced so rapid drags don't thrash storage.
  useEffect(() => {
    if (!restored.current) return;
    const t = setTimeout(() => {
      saveCanvas(mapId, { nodes, edges, viewport: getViewport() });
    }, 400);
    return () => clearTimeout(t);
  }, [mapId, nodes, edges, getViewport]);

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
      // Viewport-only changes don't trip the node/edge effect — save here too.
      saveCanvas(mapId, {
        nodes: getNodes(),
        edges: getEdges(),
        viewport: getViewport(),
      });
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
      // Re-pick the facing handles from node positions so the edge attaches at
      // the correct angle regardless of which handles the drag used.
      const ns = getNodes();
      const s = ns.find((n) => n.id === connection.source);
      const t = ns.find((n) => n.id === connection.target);
      const handles = s && t ? pickHandles(s, t) : {};
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            ...handles,
            type: "labeled",
            data: { arrowEnd: true },
            markerEnd: EDGE_MARKER,
          },
          eds,
        ),
      );
    },
    [activeTool, setEdges, getNodes],
  );

  // ── Hover-to-connect — drag a node onto another to auto-link them ──────────
  const { onNodeDrag, onNodeDragStop } = useNodeDragConnect({ setEdges });

  // ── Manual save ────────────────────────────────────────────────────────────
  const [savedFlash, setSavedFlash] = useState(false);
  const handleSave = useCallback(() => {
    saveCanvas(mapId, { nodes, edges, viewport: getViewport() });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [mapId, nodes, edges, getViewport]);

  // ── Finalise — export graph, submit to backend, go to summarise ────────────
  const handleFinalise = useCallback(() => {
    const scriptId = mapId !== "default" ? mapId : undefined;
    submitMindMap(exportMindMapGraph(nodes, edges, scriptId));
    console.log("Submitted graph:", exportMindMapGraph(nodes, edges));
    // Keep the active idea in the URL so the summarise/plan stages stay in this
    // script's context rather than the default map.
    
    const query =
      mapId !== "default" ? `?script=${encodeURIComponent(mapId)}` : "";
    router.push(`/summarise${query}`);
  }, [nodes, edges, router, mapId]);

  // ── Drag-and-drop — drop a shortlist chip to spawn a topic at the cursor ───
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes(TOPIC_DND_MIME) ||
      e.dataTransfer.types.includes(VIDEO_DND_MIME)
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Video Analysis node drop
      if (e.dataTransfer.types.includes(VIDEO_DND_MIME)) {
        addNodes({
          id: `videoDrop-${Date.now()}`,
          type: "videoDrop",
          position,
          data: { status: "idle" },
        });
        return;
      }

      // Shortlist chip drop
      const raw = e.dataTransfer.getData(TOPIC_DND_MIME);
      if (!raw) return;
      let payload: TopicDragPayload;
      try {
        payload = JSON.parse(raw) as TopicDragPayload;
      } catch {
        return;
      }
      const group = findGroup(payload.hubId);
      if (!group) return;
      spawnTopicNode({ addNodes }, group, payload.label, position);
    },
    [screenToFlowPosition, addNodes],
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
        {/* <button type="button" title="Export JSON" onClick={() => exportMindMapJSON(nodes, edges, getViewport())} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"><Download size={14} /> Export</button> */}
        {/* <button type="button" title="Export for AI analysis" onClick={() => exportMindMapForAI(nodes, edges)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"><Bot size={14} /> AI Export</button> */}
        <button
          type="button"
          title="Save canvas"
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Save size={14} />
          {savedFlash ? "Saved!" : "Save"}
        </button>
        <button
          type="button"
          title="Finalise idea and generate summary"
          onClick={handleFinalise}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-(--color-primary-hover)"
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
        onDrop={onDrop}
        onDragOver={onDragOver}
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
          className="border! border-gray-200! shadow-sm! rounded-xl! overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          className="border! border-gray-200! shadow-sm! rounded-xl! overflow-hidden transition-opacity! duration-300!"
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

function CanvasRoot() {
  const params = useSearchParams();
  // Remount the whole flow when the active idea changes so each map loads its
  // own persisted seed (refs/state reset on a fresh mount).
  const mapId = params.get("script") ?? "default";

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* <header className="shrink-0 h-11 border-b border-gray-100 flex items-center px-4 gap-3"> */}
      {/* <span className="text-sm font-semibold text-gray-800 tracking-tight">
          Mind Map
        </span>
        <ActiveToolBadge /> */}
      {/* </header> */}

      <div className="relative flex-1 overflow-hidden">
        <ReactFlowProvider key={mapId}>
          <ResizableSplit
            left={
              <CreativeHelperSidebar embedded showReminder={true}>
                <MindMapSidePanel />
              </CreativeHelperSidebar>
            }
            right={
              <>
                <CanvasInner />
                {/* <Toolbar /> */}
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
