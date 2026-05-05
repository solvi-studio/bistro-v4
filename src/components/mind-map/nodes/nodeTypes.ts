import type { NodeTypes } from "@xyflow/react";
import StickyNode from "@/components/mind-map/nodes/StickyNode";
import TextBoxNode from "@/components/mind-map/nodes/TextBoxNode";

export const nodeTypes: NodeTypes = {
  sticky: StickyNode,
  textbox: TextBoxNode,
};
