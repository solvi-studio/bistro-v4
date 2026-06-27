import type { NodeTypes } from "@xyflow/react";
import ContentNode from "@/components/mind-map/nodes/ContentNode";
import SceneNode from "@/components/mind-map/nodes/SceneNode";
import VideoNode from "@/components/mind-map/nodes/VideoNode";

export const nodeTypes: NodeTypes = {
  scene: SceneNode,
  content: ContentNode,
  videoDrop: VideoNode,
};
