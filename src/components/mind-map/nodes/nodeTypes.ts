import type { NodeTypes } from "@xyflow/react";
import StickyNode from "@/components/mind-map/nodes/StickyNode";
import TextBoxNode from "@/components/mind-map/nodes/TextBoxNode";
import ShapeNode from "@/components/mind-map/nodes/ShapeNode";

export const nodeTypes: NodeTypes = {
  sticky: StickyNode,
  textbox: TextBoxNode,
  shape: ShapeNode,
};
