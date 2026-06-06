import type { Edge, Node, Viewport } from "@xyflow/react";
import {
  MIND_MAP_GROUPS,
  type TopicSection,
} from "@/components/mind-map/constants/topics";
import type { ShapeData } from "@/components/mind-map/nodes/ShapeNode";
import type { StickyData } from "@/components/mind-map/nodes/StickyNode";
import type { TextBoxData } from "@/components/mind-map/nodes/TextBoxNode";

// Append/remove pattern required for Firefox compatibility.
function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Type-safe content extraction — each branch covers exactly one node type.
function nodeContent(node: Node): string {
  switch (node.type) {
    case "sticky":
      return (node.data as StickyData).text;
    case "textbox":
      return (node.data as TextBoxData).html.replace(/<[^>]+>/g, "");
    case "shape":
      return (node.data as ShapeData).text;
    default:
      // hub / leaf / idea nodes — ReactFlow default type: { label: string }
      return (node.data as { label?: string }).label ?? "";
  }
}

type NodeSummary = {
  id: string;
  type: string;
  subtype: string | null;
  content: string;
};

// ── Export 1: Standard (reimportable) ──────────────────────────────────────
export function exportMindMapJSON(
  nodes: Node[],
  edges: Edge[],
  viewport?: Viewport,
) {
  downloadJSON(`mindmap-${Date.now()}.json`, {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
    nodes,
    edges,
  });
}

// ── AI context graph (shared shape) ────────────────────────────────────────
// The structured payload describing the whole map: central idea, its hubs with
// live leaves, free-floating nodes, and edge context. Both the backend submit
// (`exportMindMapGraph`) and the downloadable AI export (`exportMindMapForAI`)
// emit this exact shape.

interface HubSummary {
  hubId: string;
  hubLabel: string;
  sections: TopicSection[];
  liveLeaves: NodeSummary[];
}

interface EdgeContext {
  id: string;
  from: string;
  fromContent: string;
  to: string;
  toContent: string;
  hasArrow: boolean;
  label: string;
}

export interface MindMapGraph {
  exportedAt: string;
  centralIdea: string;
  hubs: HubSummary[];
  freeNodes: NodeSummary[];
  edges: EdgeContext[];
}

function buildMindMapGraph(nodes: Node[], edges: Edge[]): MindMapGraph {
  const ideaNode = nodes.find((n) => n.id === "idea");
  const centralIdea = ideaNode ? nodeContent(ideaNode) : "";

  const nodeMap = new Map<string, NodeSummary>(
    nodes.map((n) => [
      n.id,
      {
        id: n.id,
        type: n.type ?? "default",
        subtype: n.type === "shape" ? (n.data as ShapeData).shape : null,
        content: nodeContent(n),
      },
    ]),
  );

  const hubIds = new Set(
    edges.filter((e) => e.source === "idea").map((e) => e.target),
  );

  const hubs: HubSummary[] = [...hubIds].map((hubId) => {
    const staticGroup = MIND_MAP_GROUPS.find((g) => g.hubId === hubId);
    const liveLeaves = edges
      .filter((e) => e.source === hubId)
      .map((e) => nodeMap.get(e.target))
      .filter((n): n is NodeSummary => n !== undefined);
    return {
      hubId,
      hubLabel: nodeMap.get(hubId)?.content ?? hubId,
      sections: staticGroup?.sections ?? [],
      liveLeaves,
    };
  });

  const structuredIds = new Set([
    "idea",
    ...hubIds,
    ...hubs.flatMap((h) => h.liveLeaves.map((l) => l.id)),
  ]);
  const freeNodes = nodes
    .filter((n) => !structuredIds.has(n.id))
    .map((n) => nodeMap.get(n.id))
    .filter((n): n is NodeSummary => n !== undefined);

  type EdgeData = { arrowEnd?: boolean; label?: string };
  const edgeContext: EdgeContext[] = edges.map((e) => {
    const d = (e.data ?? {}) as EdgeData;
    return {
      id: e.id,
      from: e.source,
      fromContent: nodeMap.get(e.source)?.content ?? "",
      to: e.target,
      toContent: nodeMap.get(e.target)?.content ?? "",
      hasArrow: d.arrowEnd ?? false,
      label: d.label ?? "",
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    centralIdea,
    hubs,
    freeNodes,
    edges: edgeContext,
  };
}

// ── Export 3: Backend graph payload (sent under `graph` to /api/v1/summary) ──
export function exportMindMapGraph(nodes: Node[], edges: Edge[]): MindMapGraph {
  return buildMindMapGraph(nodes, edges);
}

// ── Export 2: AI context (downloadable file, same shape) ────────────────────
export function exportMindMapForAI(nodes: Node[], edges: Edge[]) {
  downloadJSON(
    `mindmap-ai-${Date.now()}.json`,
    buildMindMapGraph(nodes, edges),
  );
}
