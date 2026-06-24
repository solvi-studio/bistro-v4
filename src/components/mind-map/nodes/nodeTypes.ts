import type { NodeTypes } from "@xyflow/react";
import SceneNode from "@/components/mind-map/nodes/SceneNode";
import ShapeNode from "@/components/mind-map/nodes/ShapeNode";
import StickyNode from "@/components/mind-map/nodes/StickyNode";
import TextBoxNode from "@/components/mind-map/nodes/TextBoxNode";
import TopicNode from "@/components/mind-map/nodes/TopicNode";
import VideoDropNode from "@/components/mind-map/nodes/VideoDropNode";

export const nodeTypes: NodeTypes = {
  // Override the built-in default node so idea/hub/leaf nodes expose side
  // handles for closest-handle edge attachment.
  default: TopicNode,
  scene: SceneNode,
  sticky: StickyNode,
  textbox: TextBoxNode,
  shape: ShapeNode,
  videoDrop: VideoDropNode,
};
