import type { Edge, Node } from "@xyflow/react";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import { pickHandles } from "@/utils/mind-map-handles";
import {
  hubNodeStyle,
  IDEA_ID,
  IDEA_POS,
  ideaNodeStyle,
  MIND_MAP_GROUPS,
} from "./topics";

// Approx node sizes for the initial closest-handle pick (before measurement).
const IDEA_BOX = { position: IDEA_POS, width: 140, height: 52 };

// Central idea node + the 4 required hub nodes ringing it.
export const INITIAL_NODES: Node[] = [
  {
    id: IDEA_ID,
    type: "default",
    position: IDEA_POS,
    data: { label: "Scene 1" },
    style: ideaNodeStyle(),
    // Anchor node — movable, but cannot be deleted.
    deletable: false,
  },
  ...MIND_MAP_GROUPS.map<Node>((g) => ({
    id: g.hubId,
    type: "default",
    position: g.hubPos,
    data: { label: g.hubLabel },
    style: hubNodeStyle(g.hubBg),
    // Hubs are deletable like any other node now.
    deletable: true,
  })),
];

// Each hub is wired to the central idea node, attaching to the handles that
// face each other (picked once from their positions).
export const INITIAL_EDGES: Edge[] = MIND_MAP_GROUPS.map<Edge>((g) => {
  const { sourceHandle, targetHandle } = pickHandles(IDEA_BOX, {
    position: g.hubPos,
    width: 150,
    height: 44,
  });
  return {
    id: `e-idea-${g.hubId}`,
    source: IDEA_ID,
    target: g.hubId,
    sourceHandle,
    targetHandle,
    type: "labeled",
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  };
});
