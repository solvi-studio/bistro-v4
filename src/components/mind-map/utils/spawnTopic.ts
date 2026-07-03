import type { Node } from "@xyflow/react";
import type { ContentCategory } from "@/components/mind-map/constants/topics";
import type { ContentNodeData } from "@/components/mind-map/nodes/ContentNode";
import { placeNode, rectOf } from "@/utils/mind-map-layout";

export const TOPIC_DND_MIME = "application/x-mindmap-topic";
export const VIDEO_DND_MIME = "application/x-mindmap-video";

export interface TopicDragPayload {
  category: ContentCategory;
  header: string;
}

// Default card size used when the node hasn't been rendered yet.
const SPAWN_W = 200;
const SPAWN_H = 96;

// Default anchor when no position is given (sidebar click with no drag).
const DEFAULT_ANCHOR = { x: 400, y: 300 };

interface FlowOps {
  addNodes: (nodes: Node | Node[]) => void;
  getNodes: () => Node[];
}

// Drop a sidebar chip or click onto the canvas as a themed content node.
//
// If `position` is given (drag-to-canvas), the node tries to land exactly
// there; if that spot overlaps an existing node it nudges to the nearest
// free slot. If no position is given (sidebar click), it finds a free slot
// near the default anchor.
export function spawnContentNode(
  rf: FlowOps,
  category: ContentCategory,
  header: string,
  position?: { x: number; y: number },
): void {
  const trimmed = header.trim();
  if (!trimmed) return;

  const occupied = rf.getNodes().map(rectOf);
  const anchor = position ?? DEFAULT_ANCHOR;

  const pos = placeNode(occupied, anchor.x, anchor.y, 1, SPAWN_W, SPAWN_H);

  const data: ContentNodeData =
    trimmed === "Timing"
      ? {
          category,
          header: trimmed,
          duration: "0:10",
          fontSize: 14,
          width: SPAWN_W,
        }
      : {
          category,
          header: trimmed,
          body: "",
          fontSize: 14,
          width: SPAWN_W,
        };

  rf.addNodes({
    id: `content-${category}-${Date.now()}`,
    type: "content",
    position: pos,
    data,
  });
}
