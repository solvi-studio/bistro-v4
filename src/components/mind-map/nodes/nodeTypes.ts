import type { NodeTypes } from "@xyflow/react";
import ShapeNode from "@/components/mind-map/nodes/ShapeNode";
import StickyNode from "@/components/mind-map/nodes/StickyNode";
import TextBoxNode from "@/components/mind-map/nodes/TextBoxNode";
import VideoDropNode from "@/components/mind-map/nodes/VideoDropNode";

export const nodeTypes: NodeTypes = {
  sticky: StickyNode,
  textbox: TextBoxNode,
  shape: ShapeNode,
  videoDrop: VideoDropNode,
};
