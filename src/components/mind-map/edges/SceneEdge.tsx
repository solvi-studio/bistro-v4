"use client";

import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";

export type SceneEdgeType = Edge<Record<string, never>, "sceneEdge">;

// Scene-sequence edge — visually distinct from labeled (concept) edges so
// Gemini can tell "scene chain" from "concept link" when reading the graph.
// Amber, slightly thicker, no label, no arrowhead.
export default function SceneEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<SceneEdgeType>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{ stroke: "#f59e0b", strokeWidth: 2.5, strokeDasharray: "6 3" }}
    />
  );
}
