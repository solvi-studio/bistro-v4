import { Node, Edge, Viewport } from "@xyflow/react";
import {
  MindMapFile,
  SerializedNode,
  SerializedEdge,
  SerializedNodeType,
} from "@/components/mind-map/types/mindmap-schema";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";

// ─── Build ────────────────────────────────────────────────────────────────────

export function buildMindMapFile(
  mapId: string,
  mapName: string,
  nodes: Node[],
  edges: Edge[],
  viewport: Viewport,
  createdAt: string
): MindMapFile {
  return {
    schemaVersion: 1,
    meta: {
      id: mapId,
      name: mapName,
      createdAt,
      modifiedAt: new Date().toISOString(),
    },
    viewport,
    nodes: nodes.map(serializeNode),
    edges: edges.map(serializeEdge),
  };
}

// ─── Strip ReactFlow internals ────────────────────────────────────────────────

function serializeNode(node: Node): SerializedNode {
  return {
    id: node.id,
    type: node.type as SerializedNodeType,
    position: { x: node.position.x, y: node.position.y },
    width: node.width,
    height: node.height,
    zIndex: node.zIndex,
    style: node.style as Record<string, unknown> | undefined,
    data: node.data as unknown as SerializedNode["data"],
  };
}

function serializeEdge(edge: Edge): SerializedEdge {
  return {
    id: edge.id,
    type: "labeled",
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: (edge.data ?? {}) as SerializedEdge["data"],
    style: edge.style as Record<string, unknown> | undefined,
  };
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export function restoreNodes(serialized: SerializedNode[]): Node[] {
  return serialized.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    width: n.width,
    height: n.height,
    zIndex: n.zIndex,
    style: n.style as Node["style"],
    data: n.data as unknown as Record<string, unknown>,
    selected: false,
  }));
}

export function restoreEdges(serialized: SerializedEdge[]): Edge[] {
  return serialized.map((e) => ({
    id: e.id,
    type: e.type,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    data: e.data,
    style: e.style as Edge["style"],
    markerStart: e.data?.arrowStart ? EDGE_MARKER : undefined,
    markerEnd: e.data?.arrowEnd ? EDGE_MARKER : undefined,
  }));
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidMindMapFile(raw: unknown): raw is MindMapFile {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (r.schemaVersion !== 1) return false;
  if (typeof r.meta !== "object" || r.meta === null) return false;
  const meta = r.meta as Record<string, unknown>;
  if (typeof meta.id !== "string") return false;
  if (!Array.isArray(r.nodes)) return false;
  if (!Array.isArray(r.edges)) return false;
  return true;
}

// ─── Migration ────────────────────────────────────────────────────────────────

export function migrate(file: MindMapFile): MindMapFile {
  // v1 is current — no-op. Add cases here for future versions.
  return file;
}
