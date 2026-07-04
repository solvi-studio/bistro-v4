"use client";

import {
  addEdge,
  type Edge,
  type Node,
  type OnNodeDrag,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useRef } from "react";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import { pickHandles } from "@/utils/mind-map-handles";

const DROP_TARGET_CLASS = "mm-drop-target";

function setNodeHighlight(nodeId: string | null) {
  for (const el of document.querySelectorAll(
    `.react-flow__node.${DROP_TARGET_CLASS}`,
  )) {
    el.classList.remove(DROP_TARGET_CLASS);
  }
  if (nodeId) {
    document
      .querySelector(`.react-flow__node[data-id="${nodeId}"]`)
      ?.classList.add(DROP_TARGET_CLASS);
  }
}

// ── Connection direction normalisation ────────────────────────────────────────
// Rule: scene is always the source when exactly one side is a scene.
// Scene→scene is always sceneEdge; non-scene→non-scene uses labeled edge.

function normalizeSceneEdge(
  a: Node,
  b: Node,
): { source: Node; target: Node } {
  if (a.type === "scene" && b.type !== "scene") return { source: a, target: b };
  if (b.type === "scene" && a.type !== "scene") return { source: b, target: a };
  // scene↔scene or content↔content — keep original order
  return { source: a, target: b };
}

function buildConnectedEdge(
  source: Node,
  target: Node,
  sourceHandle: string | undefined,
  targetHandle: string | undefined,
): Edge {
  const id = `e-${source.id}-${target.id}`;
  if (source.type === "scene" && target.type === "scene") {
    return {
      id,
      source: source.id,
      target: target.id,
      sourceHandle,
      targetHandle,
      type: "sceneEdge" as const,
    };
  }
  return {
    id,
    source: source.id,
    target: target.id,
    sourceHandle,
    targetHandle,
    type: "labeled" as const,
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  };
}

/** Check that adding this scene→scene edge keeps the chain linear. */
function wouldBreakChain(
  sourceId: string,
  targetId: string,
  edges: Edge[],
): boolean {
  // Source already has an outgoing sceneEdge
  const sourceHasSuccessor = edges.some(
    (e) => e.type === "sceneEdge" && e.source === sourceId,
  );
  // Target already has an incoming sceneEdge
  const targetHasPredecessor = edges.some(
    (e) => e.type === "sceneEdge" && e.target === targetId,
  );
  return sourceHasSuccessor || targetHasPredecessor;
}

export function useNodeDragConnect({
  setEdges,
}: {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}): { onNodeDrag: OnNodeDrag; onNodeDragStop: OnNodeDrag } {
  const { getIntersectingNodes, getNodes, getEdges } = useReactFlow();
  const dropTargetRef = useRef<string | null>(null);

  const firstIntersectingId = useCallback(
    (node: Node): string | null => {
      const hit = getIntersectingNodes(node, true).find(
        (n) => n.id !== node.id,
      );
      return hit?.id ?? null;
    },
    [getIntersectingNodes],
  );

  const onNodeDrag: OnNodeDrag = useCallback(
    (_e, node) => {
      const targetId = firstIntersectingId(node);
      if (targetId !== dropTargetRef.current) {
        dropTargetRef.current = targetId;
        setNodeHighlight(targetId);
      }
    },
    [firstIntersectingId],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, node) => {
      const targetId = dropTargetRef.current;
      dropTargetRef.current = null;
      setNodeHighlight(null);
      if (!targetId) return;

      const rawTarget = getNodes().find((n) => n.id === targetId);
      if (!rawTarget) return;

      // Normalise direction: scene is always source
      const { source, target } = normalizeSceneEdge(rawTarget, node);

      // Reject scene→scene if it would branch the chain
      if (
        source.type === "scene" &&
        target.type === "scene" &&
        wouldBreakChain(source.id, target.id, getEdges())
      ) {
        return;
      }

      const alreadyLinked = getEdges().some(
        (e) =>
          (e.source === source.id && e.target === target.id) ||
          (e.source === target.id && e.target === source.id),
      );
      if (alreadyLinked) return;

      const { sourceHandle, targetHandle } = pickHandles(source, target);
      setEdges((eds) =>
        addEdge(
          buildConnectedEdge(source, target, sourceHandle, targetHandle),
          eds,
        ),
      );
    },
    [getNodes, getEdges, setEdges],
  );

  return { onNodeDrag, onNodeDragStop };
}
