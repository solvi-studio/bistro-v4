import type { Edge, Node, Viewport } from "@xyflow/react";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";
import { getScripts } from "@/utils/creative";

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

function nodeContent(node: Node): string {
  if (node.type === "content") {
    const d = node.data as ContentNodeData;
    // header + body so AI gets full context
    return [d.header, d.body].filter(Boolean).join(": ");
  }
  return (node.data as { label?: string }).label ?? "";
}

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

// ── Scene-oriented AI graph ─────────────────────────────────────────────────

export interface SceneTopic {
  hubLabel: string;
  items: string[];
}

export interface VideoInspiration {
  videoId: string;
  insights: string[];
}

export interface SceneExport {
  id: string;
  label: string;
  order: number;
  /** Content nodes directly connected to this scene. */
  topics: SceneTopic[];
  /** Video analysis nodes connected to this scene, with their insight leaves. */
  videoInspirations: VideoInspiration[];
  /** Loose notes directly connected to this scene with no sub-structure. */
  notes: string[];
}

export interface MindMapGraph {
  exportedAt: string;
  project: {
    name: string;
    goal: string;
    platform: string;
  };
  /** Scenes in chain order (derived from sceneEdge sequence). */
  scenes: SceneExport[];
  /** Nodes not reachable from any scene. */
  globalNotes: string[];
}

function buildMindMapGraph(
  nodes: Node[],
  edges: Edge[],
  scriptId?: string,
): MindMapGraph {
  const script = scriptId ? getScripts().find((s) => s.id === scriptId) : null;
  const project = {
    name: script?.title ?? "Untitled",
    goal: script?.goal ?? "",
    platform: script?.platform ?? "",
  };

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const contentOf = (id: string) => {
    const n = nodeById.get(id);
    return n ? nodeContent(n) : "";
  };

  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  const sceneEdgeTargets = new Set<string>();

  for (const edge of edges) {
    const out = outEdges.get(edge.source) ?? [];
    out.push(edge.target);
    outEdges.set(edge.source, out);

    const inc = inEdges.get(edge.target) ?? [];
    inc.push(edge.source);
    inEdges.set(edge.target, inc);

    if (edge.type === "sceneEdge") sceneEdgeTargets.add(edge.target);
  }

  const sceneIds = nodes.filter((n) => n.type === "scene").map((n) => n.id);
  const sceneSet = new Set(sceneIds);

  const sceneNext = new Map<string, string>();
  for (const edge of edges) {
    if (
      edge.type === "sceneEdge" &&
      sceneSet.has(edge.source) &&
      sceneSet.has(edge.target)
    ) {
      sceneNext.set(edge.source, edge.target);
    }
  }

  const orderedSceneIds: string[] = [];
  const visited = new Set<string>();

  for (const rootId of sceneIds.filter((id) => !sceneEdgeTargets.has(id))) {
    let cur: string | undefined = rootId;
    while (cur && !visited.has(cur)) {
      if (sceneSet.has(cur)) {
        orderedSceneIds.push(cur);
        visited.add(cur);
      }
      cur = sceneNext.get(cur);
    }
  }

  for (const id of sceneIds) {
    if (!visited.has(id)) orderedSceneIds.push(id);
  }

  const claimedIds = new Set<string>(sceneSet);

  const scenes: SceneExport[] = orderedSceneIds.map((sceneId, idx) => {
    const topics: SceneTopic[] = [];
    const videoInspirations: VideoInspiration[] = [];
    const notes: string[] = [];

    const neighborIds = new Set([
      ...(outEdges.get(sceneId) ?? []),
      ...(inEdges.get(sceneId) ?? []),
    ]);

    for (const targetId of neighborIds) {
      if (sceneSet.has(targetId)) continue;
      const target = nodeById.get(targetId);
      if (!target) continue;
      claimedIds.add(targetId);

      if (target.type === "videoDrop") {
        const insightIds = outEdges.get(targetId) ?? [];
        const insights = insightIds
          .map((id) => {
            claimedIds.add(id);
            return contentOf(id);
          })
          .filter(Boolean);
        if (insights.length > 0) {
          videoInspirations.push({ videoId: targetId, insights });
        }
      } else if (target.type === "content") {
        // Content nodes group by their header as the hub label
        const d = target.data as ContentNodeData;
        const body = d.body?.trim();
        if (body) {
          topics.push({ hubLabel: d.header, items: [body] });
        } else {
          notes.push(d.header);
        }
      } else {
        const leafIds = (outEdges.get(targetId) ?? []).filter(
          (id) => !sceneSet.has(id),
        );
        if (leafIds.length > 0) {
          const items = leafIds
            .map((id) => {
              claimedIds.add(id);
              return contentOf(id);
            })
            .filter(Boolean);
          topics.push({ hubLabel: contentOf(targetId), items });
        } else {
          notes.push(contentOf(targetId));
        }
      }
    }

    return {
      id: sceneId,
      label: contentOf(sceneId),
      order: idx + 1,
      topics,
      videoInspirations,
      notes,
    };
  });

  const globalNotes = nodes
    .filter((n) => !claimedIds.has(n.id) && n.type !== "videoDrop")
    .map((n) => nodeContent(n))
    .filter(Boolean);

  return {
    exportedAt: new Date().toISOString(),
    project,
    scenes,
    globalNotes,
  };
}

// ── Export 2: Backend payload (sent to /api/v1/summary) ─────────────────────
export function exportMindMapGraph(
  nodes: Node[],
  edges: Edge[],
  scriptId?: string,
): MindMapGraph {
  return buildMindMapGraph(nodes, edges, scriptId);
}

// ── Export 3: Downloadable AI context file ───────────────────────────────────
export function exportMindMapForAI(
  nodes: Node[],
  edges: Edge[],
  scriptId?: string,
) {
  downloadJSON(
    `mindmap-ai-${Date.now()}.json`,
    buildMindMapGraph(nodes, edges, scriptId),
  );
}
