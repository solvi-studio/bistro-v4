import type { Edge, Node } from "@xyflow/react";
import {
  leafNodeStyle,
  MIND_MAP_GROUPS,
  type MindMapGroup,
} from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import { pickHandles } from "@/utils/mind-map-handles";

// MIME type carrying a shortlist chip across an HTML5 drag onto the canvas.
export const TOPIC_DND_MIME = "application/x-mindmap-topic";

export interface TopicDragPayload {
  hubId: string;
  label: string;
}

function truncate(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// Minimal slice of the ReactFlow instance the spawn needs — shared by the
// side-panel (click) and canvas (drop) callers.
interface FlowOps {
  addNodes: (nodes: Node | Node[]) => void;
  addEdges: (edges: Edge | Edge[]) => void;
  getNode: (id: string) => Node | undefined;
  getNodes: () => Node[];
}

export function findGroup(hubId: string): MindMapGroup | undefined {
  return MIND_MAP_GROUPS.find((g) => g.hubId === hubId);
}

// Create a leaf topic node wired to its hub. `position` overrides the default
// stagger when set (used by drag-and-drop, where the cursor decides placement).
export function spawnTopicNode(
  rf: FlowOps,
  group: MindMapGroup,
  label: string,
  position?: { x: number; y: number },
): void {
  const text = label.trim();
  if (!text) return;
  const hub = rf.getNode(group.hubId);
  if (!hub) return;

  const siblings = rf
    .getNodes()
    .filter((n) => n.id.startsWith(`topic-${group.hubId}-`));
  const id = `topic-${group.hubId}-${Date.now()}`;
  const pos = position ?? {
    x: hub.position.x + group.leafDir * 250,
    y: hub.position.y + siblings.length * 64 - 40,
  };

  rf.addNodes({
    id,
    type: "default",
    position: pos,
    data: { label: truncate(text) },
    style: leafNodeStyle(group.leafBg, group.leafText),
  });

  // Wire the new topic to its hub, attaching to the handles that face each
  // other (chosen once, here at creation).
  const { sourceHandle, targetHandle } = pickHandles(hub, {
    position: pos,
    width: 210,
    height: 40,
  });
  rf.addEdges({
    id: `e-${id}`,
    source: group.hubId,
    target: id,
    sourceHandle,
    targetHandle,
    type: "labeled",
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  });
}
