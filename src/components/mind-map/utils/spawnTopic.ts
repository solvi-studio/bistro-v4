import type { Node } from "@xyflow/react";
import type { ContentCategory } from "@/components/mind-map/constants/topics";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";

export const TOPIC_DND_MIME = "application/x-mindmap-topic";
export const VIDEO_DND_MIME = "application/x-mindmap-video";

export interface TopicDragPayload {
  category: ContentCategory;
  header: string;
}

interface FlowOps {
  addNodes: (nodes: Node | Node[]) => void;
}

// Drop a sidebar chip or click onto the canvas as a themed content node.
export function spawnContentNode(
  rf: FlowOps,
  category: ContentCategory,
  header: string,
  position?: { x: number; y: number },
): void {
  const trimmed = header.trim();
  if (!trimmed) return;

  const pos = position ?? { x: 400, y: 300 };

  const data: ContentNodeData = {
    category,
    header: trimmed,
    body: "",
    fontSize: 14,
  };

  rf.addNodes({
    id: `content-${category}-${Date.now()}`,
    type: "content",
    position: pos,
    data,
  });
}
