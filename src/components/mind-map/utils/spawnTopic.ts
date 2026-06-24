import type { Node } from "@xyflow/react";
import {
  leafNodeStyle,
  MIND_MAP_GROUPS,
  type MindMapGroup,
} from "@/components/mind-map/constants/topics";

export const TOPIC_DND_MIME = "application/x-mindmap-topic";
export const VIDEO_DND_MIME = "application/x-mindmap-video";

export interface TopicDragPayload {
  hubId: string;
  label: string;
}

function truncate(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

interface FlowOps {
  addNodes: (nodes: Node | Node[]) => void;
}

export function findGroup(hubId: string): MindMapGroup | undefined {
  return MIND_MAP_GROUPS.find((g) => g.hubId === hubId);
}

// Drop a shortlist chip onto the canvas as a plain colored leaf node.
// No hub lookup, no edge — the user wires things manually.
export function spawnTopicNode(
  rf: FlowOps,
  group: MindMapGroup,
  label: string,
  position?: { x: number; y: number },
): void {
  const text = label.trim();
  if (!text) return;

  const pos = position ?? { x: 400, y: 300 };

  rf.addNodes({
    id: `topic-${group.hubId}-${Date.now()}`,
    type: "default",
    position: pos,
    data: { label: truncate(text) },
    style: leafNodeStyle(group.leafBg, group.leafText),
  });
}
