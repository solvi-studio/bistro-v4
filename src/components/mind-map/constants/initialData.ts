import type { Edge, Node } from "@xyflow/react";
import { SCENE_NODE_STYLE } from "@/components/mind-map/nodes/SceneNode";
import { IDEA_ID, IDEA_POS } from "./topics";

export const INITIAL_NODES: Node[] = [
  {
    id: IDEA_ID,
    type: "scene",
    position: IDEA_POS,
    data: { label: "Scene 1" },
    style: SCENE_NODE_STYLE,
    deletable: false,
  },
];

export const INITIAL_EDGES: Edge[] = [];
