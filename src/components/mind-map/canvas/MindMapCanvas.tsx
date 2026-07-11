"use client";

import { useUser } from "@clerk/nextjs";
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
import type { ContentCategory } from "@/components/mind-map/constants/topics";
import {
  categoryGlowColor,
  VIDEO_BLOCK_COLOR,
} from "@/components/mind-map/hooks/useNodeDragConnect";
import {
  CAT_DND_PREFIX,
  spawnContentNode,
  TOPIC_DND_MIME,
  type TopicDragPayload,
  VIDEO_DND_MIME,
} from "@/components/mind-map/utils/spawnTopic";
import { loadCanvas, saveCanvas } from "@/lib/db/actions/mindmap";
import { pickHandles } from "@/utils/mind-map-handles";
import { placeNode, rectOf } from "@/utils/mind-map-layout";
import { exportMindMapGraph } from "@/utils/mindmap-export";
import { recordFolderOpened } from "@/utils/recentFolder";
import { submitMindMap } from "@/utils/summarise-service";
import "@xyflow/react/dist/style.css";

import CreativeHelperSidebar from "@/components/creative/CreativeHelperSidebar";
import { EraserCursor } from "@/components/mind-map/canvas/EraserCursor";
import MindMapSidePanel from "@/components/mind-map/canvas/MindMapSidePanel";
import ResizableSplit from "@/components/mind-map/canvas/ResizableSplit";
import SceneConnectionOverlay from "@/components/mind-map/canvas/SceneConnectionOverlay";
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

// ─── Cursor map per tool ──────────────────────────────────────────────────────

const CURSOR: Record<Tool, string> = {
  select: "default",
  connector: "crosshair",
  eraser: "none",
  video: "crosshair",
};

// ─── Scene chain helpers (used by renumber effect) ────────────────────────────

function buildSceneChainOrder(nodes: Node[], edges: Edge[]): string[] {
  const sceneNodes = nodes.filter((n) => n.type === "scene");
  const sceneSet = new Set(sceneNodes.map((n) => n.id));

  const sceneNext = new Map<string, string>();
  const sceneEdgeTargets = new Set<string>();
  for (const e of edges) {
    if (
      e.type === "sceneEdge" &&
      sceneSet.has(e.source) &&
      sceneSet.has(e.target)
    ) {
      sceneNext.set(e.source, e.target);
      sceneEdgeTargets.add(e.target);
    }
  }

  const roots = sceneNodes
    .filter((n) => !sceneEdgeTargets.has(n.id))
    .map((n) => n.id);

  const ordered: string[] = [];
  const visited = new Set<string>();
  for (const root of roots) {
    let cur: string | undefined = root;
    while (cur && !visited.has(cur) && sceneSet.has(cur)) {
      ordered.push(cur);
      visited.add(cur);
      cur = sceneNext.get(cur);
    }
  }
  // Append disconnected scenes
  for (const n of sceneNodes) {
    if (!visited.has(n.id)) ordered.push(n.id);
  }
  return ordered;
}

// ─── Connection direction + chain validation ──────────────────────────────────

function wouldBreakChain(
  sourceId: string,
  targetId: string,
  edges: Edge[],
): boolean {
  return (
    edges.some((e) => e.type === "sceneEdge" && e.source === sourceId) ||
    edges.some((e) => e.type === "sceneEdge" && e.target === targetId)
  );
}

// ─── Inner canvas ─────────────────────────────────────────────────────────────

function CanvasInner() {
  const { activeTool, setActiveTool } = useTool();
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
  const mapId = params.get("script") ?? "default";
  const { user } = useUser();
  const userId = user?.id;

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  const restored = useRef(false);
  useEffect(() => {
    restored.current = false;
    loadCanvas(mapId)
      .then((saved) => {
        if (saved) {
          setNodes(saved.nodes);
          setEdges(saved.edges);
          if (saved.viewport)
            setViewport(saved.viewport as Parameters<typeof setViewport>[0]);
        }
      })
      .catch(console.error)
      .finally(() => {
        restored.current = true;
      });
  }, [mapId, setNodes, setEdges, setViewport]);

  // Folder-opened analytics ping — needs userId once Clerk resolves it, but
  // must NOT re-trigger the full canvas restore above. loadCanvas
  // authenticates server-side via its own session and never reads this
  // client userId, so folding it into that effect's deps only meant the
  // whole canvas got re-fetched a second time on every load (once at
  // userId=undefined, once when Clerk resolves) — silently clobbering any
  // in-session correction made between the two, e.g. VideoNode's
  // reload-status reset, with a stale DB read.
  useEffect(() => {
    if (userId) recordFolderOpened(userId, mapId);
  }, [userId, mapId]);

  // Debounced autosave (fire-and-forget — DB write)
  useEffect(() => {
    if (!restored.current) return;
    const t = setTimeout(() => {
      saveCanvas(mapId, { nodes, edges, viewport: getViewport() }).catch(
        console.error,
      );
    }, 800);
    return () => clearTimeout(t);
  }, [mapId, nodes, edges, getViewport]);

  // ── Scene renumber — keep Scene N labels sequential after add/delete ────────
  // Functional setNodes: this effect can fire in the same commit as a child
  // node's own mount effect (e.g. VideoNode's reload-status reset). A plain
  // `setNodes(updated)` built from the stale `nodes` closure would overwrite
  // that concurrent update; merging onto `prev` instead always keeps it.
  // `nodes` must stay in deps so this re-runs after node add/delete — the
  // functional updater deliberately reads `prev`, not `nodes`, to avoid the
  // stale-closure race described above, but the effect still needs to be
  // triggered by node changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (!restored.current) return;
    setNodes((prev) => {
      const ordered = buildSceneChainOrder(prev, edges);
      let needsUpdate = false;
      const updated = prev.map((n) => {
        if (n.type !== "scene") return n;
        const idx = ordered.indexOf(n.id);
        const expected =
          idx >= 0 ? `Scene ${idx + 1}` : (n.data as { label?: string }).label;
        if ((n.data as { label?: string }).label === expected) return n;
        needsUpdate = true;
        return { ...n, data: { ...n.data, label: expected } };
      });
      return needsUpdate ? updated : prev;
    });
  }, [nodes, edges, setNodes]);

  const isSelectTool = activeTool === "select";

  const { isEraserActive, eraserPos, handlers: eraserHandlers } = useEraser();

  // ── Minimap — show while panning, hide 1.5s after stopping ───────────────
  const [showMinimap, setShowMinimap] = useState(false);
  const minimapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useOnViewportChange({
    onStart: () => {
      if (minimapTimer.current) clearTimeout(minimapTimer.current);
      setShowMinimap(true);
    },
    onEnd: () => {
      minimapTimer.current = setTimeout(() => setShowMinimap(false), 1500);
      saveCanvas(mapId, {
        nodes: getNodes(),
        edges: getEdges(),
        viewport: getViewport(),
      }).catch(console.error);
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

  // ── Edge connection (connector tool) ──────────────────────────────────────
  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (connection.source === connection.target) return false;

      // No duplicate edges (either direction)
      const existingEdge = getEdges().some(
        (e) =>
          (e.source === connection.source && e.target === connection.target) ||
          (e.source === connection.target && e.target === connection.source),
      );
      if (existingEdge) return false;

      // Content nodes cannot connect to other content nodes (video is unrestricted).
      const ns = getNodes();
      const src = ns.find((n) => n.id === connection.source);
      const tgt = ns.find((n) => n.id === connection.target);
      if (src?.type === "content" && tgt?.type === "content") return false;

      return true;
    },
    [getEdges, getNodes],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (activeTool !== "connector" && activeTool !== "select") return;

      const ns = getNodes();
      let src = ns.find((n) => n.id === connection.source);
      let tgt = ns.find((n) => n.id === connection.target);
      if (!src || !tgt) return;

      // Normalise direction: scene → non-scene
      if (tgt.type === "scene" && src.type !== "scene") {
        [src, tgt] = [tgt, src];
      }

      // Scene → scene: enforce linear chain
      if (src.type === "scene" && tgt.type === "scene") {
        if (wouldBreakChain(src.id, tgt.id, getEdges())) return;
        setEdges((eds) =>
          addEdge(
            {
              id: `se-${src.id}-${tgt.id}`,
              source: src.id,
              target: tgt.id,
              type: "sceneEdge",
              sourceHandle: "bottom",
              targetHandle: "top",
            },
            eds,
          ),
        );
        return;
      }

      // All other connections: labeled with arrow from source
      const handles = pickHandles(src, tgt);
      setEdges((eds) =>
        addEdge(
          {
            source: src.id,
            target: tgt.id,
            ...handles,
            type: "labeled",
            data: { arrowEnd: true },
            markerEnd: EDGE_MARKER,
          },
          eds,
        ),
      );
    },
    [activeTool, setEdges, getNodes, getEdges],
  );

  // ── Drag-to-link ──────────────────────────────────────────────────────────
  const {
    onNodeDrag,
    onNodeDragStop,
    proximity,
    onExternalDragOver,
    clearProximity,
    connectExternalNode,
  } = useNodeDragConnect({
    setEdges,
  });

  // ── Manual save ───────────────────────────────────────────────────────────
  const [savedFlash, setSavedFlash] = useState(false);
  const handleSave = useCallback(() => {
    saveCanvas(mapId, { nodes, edges, viewport: getViewport() }).catch(
      console.error,
    );
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [mapId, nodes, edges, getViewport]);

  // ── Finalise ──────────────────────────────────────────────────────────────
  const handleFinalise = useCallback(async () => {
    const scriptId = mapId !== "default" ? mapId : undefined;
    try {
      const graph = await exportMindMapGraph(nodes, edges, scriptId);
      submitMindMap(graph, mapId).catch(console.error);
    } catch (err) {
      console.error("Failed to export mind map:", err);
      return;
    }
    const query =
      mapId !== "default" ? `?script=${encodeURIComponent(mapId)}` : "";
    router.push(`/summarise${query}`);
  }, [nodes, edges, router, mapId]);

  // ── Drag-and-drop — sidebar chip or video card ────────────────────────────
  // Category rides in the drag MIME type (application/x-mindmap-cat-<cat>),
  // not the JSON payload — `getData()` is unreadable during `dragover`, only
  // `dataTransfer.types` is, so this is the only way to know the block's
  // color before it's actually dropped.
  const dragCategory = useCallback(
    (types: readonly string[]): ContentCategory | null => {
      const t = types.find((t) => t.startsWith(CAT_DND_PREFIX));
      return t ? (t.slice(CAT_DND_PREFIX.length) as ContentCategory) : null;
    },
    [],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      const isVideo = e.dataTransfer.types.includes(VIDEO_DND_MIME);
      const isTopic = e.dataTransfer.types.includes(TOPIC_DND_MIME);
      if (!isVideo && !isTopic) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      if (isVideo) {
        onExternalDragOver(
          { x: p.x, y: p.y, w: 280, h: 380 },
          VIDEO_BLOCK_COLOR,
        );
        return;
      }
      const cat = dragCategory(e.dataTransfer.types);
      onExternalDragOver(
        { x: p.x, y: p.y, w: 200, h: 96 },
        cat ? categoryGlowColor(cat) : VIDEO_BLOCK_COLOR,
      );
    },
    [screenToFlowPosition, onExternalDragOver, dragCategory],
  );

  const onDragLeave = useCallback(() => clearProximity(), [clearProximity]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Video node drop — nudge to nearest free slot if cursor lands on a node.
      if (e.dataTransfer.types.includes(VIDEO_DND_MIME)) {
        const occupied = getNodes().map(rectOf);
        const pos = placeNode(occupied, position.x, position.y, 1, 280, 380);
        const node = {
          id: `videoDrop-${Date.now()}`,
          type: "videoDrop",
          position: pos,
          data: { status: "idle" },
        };
        addNodes(node);
        connectExternalNode(node, {
          x: position.x,
          y: position.y,
          w: 280,
          h: 380,
        });
        clearProximity();
        return;
      }

      // Content chip drop — spawnContentNode handles collision + nudge.
      const raw = e.dataTransfer.getData(TOPIC_DND_MIME);
      if (!raw) {
        clearProximity();
        return;
      }
      let payload: TopicDragPayload;
      try {
        payload = JSON.parse(raw) as TopicDragPayload;
      } catch {
        clearProximity();
        return;
      }
      const node = spawnContentNode(
        { addNodes, getNodes },
        payload.category,
        payload.header,
        position,
      );
      if (node)
        connectExternalNode(node, {
          x: position.x,
          y: position.y,
          w: 200,
          h: 96,
        });
      clearProximity();
    },
    [
      screenToFlowPosition,
      addNodes,
      getNodes,
      connectExternalNode,
      clearProximity,
    ],
  );

  // ── Pane click — place video node ─────────────────────────────────────────
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "video") {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addNodes({
          id: `videoDrop-${Date.now()}`,
          type: "videoDrop",
          position,
          data: { status: "idle" },
        });
        setActiveTool("select");
      }
    },
    [activeTool, screenToFlowPosition, addNodes, setActiveTool],
  );

  return (
    <div
      className="w-full h-full relative"
      style={{ cursor: isEraserActive ? "none" : CURSOR[activeTool] }}
      onPointerDown={eraserHandlers.onPointerDown}
      onPointerUp={eraserHandlers.onPointerUp}
      onPointerLeave={eraserHandlers.onPointerLeave}
    >
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 pointer-events-auto">
        <div className="flex gap-2">
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
        <p className="text-[11px] text-gray-400 text-right pointer-events-none">
          Not saved automatically — click Save to keep changes.
        </p>
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
        onDragLeave={onDragLeave}
        onNodeClick={eraserHandlers.onNodeClick}
        onNodeMouseEnter={eraserHandlers.onNodeMouseEnter}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isSelectTool}
        nodesConnectable={activeTool === "connector" || isSelectTool}
        elementsSelectable={isSelectTool}
        panOnDrag={isSelectTool || activeTool === "connector"}
        selectionOnDrag={isSelectTool}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
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
        <SceneConnectionOverlay proximity={proximity} />
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
  const mapId = params.get("script") ?? "default";

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <ReactFlowProvider key={mapId}>
          <ResizableSplit
            left={
              <CreativeHelperSidebar embedded showReminder={true}>
                <MindMapSidePanel />
              </CreativeHelperSidebar>
            }
            right={<CanvasInner />}
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
