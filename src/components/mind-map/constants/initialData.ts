import type { Edge, Node } from "@xyflow/react";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import {
  hubNodeStyle,
  IDEA_ID,
  IDEA_POS,
  ideaNodeStyle,
  MIND_MAP_GROUPS,
} from "./topics";

// Central idea node + the 4 required hub nodes ringing it.
export const INITIAL_NODES: Node[] = [
  {
    id: IDEA_ID,
    type: "default",
    position: IDEA_POS,
    data: { label: "Your Idea" },
    style: ideaNodeStyle(),
  },
  ...MIND_MAP_GROUPS.map<Node>((g) => ({
    id: g.hubId,
    type: "default",
    position: g.hubPos,
    data: { label: g.hubLabel },
    style: hubNodeStyle(g.hubBg),
  })),
];

// Each hub is wired to the central idea node.
export const INITIAL_EDGES: Edge[] = MIND_MAP_GROUPS.map<Edge>((g) => ({
  id: `e-idea-${g.hubId}`,
  source: IDEA_ID,
  target: g.hubId,
  type: "labeled",
  data: { arrowEnd: true },
  markerEnd: EDGE_MARKER,
}));
