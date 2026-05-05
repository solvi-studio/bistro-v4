import type { Node, Edge } from "@xyflow/react";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";

export const INITIAL_NODES: Node[] = [
  {
    id: "demo-1",
    type: "default",
    position: { x: 200, y: 180 },
    data: { label: "Your first idea" },
    style: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 14,
      color: "#111827",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
  },
  {
    id: "demo-2",
    type: "default",
    position: { x: 480, y: 100 },
    data: { label: "Branch A" },
    style: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 14,
      color: "#111827",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
  },
  {
    id: "demo-3",
    type: "default",
    position: { x: 480, y: 260 },
    data: { label: "Branch B" },
    style: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 14,
      color: "#111827",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
  },
];

export const INITIAL_EDGES: Edge[] = [
  {
    id: "e1-2",
    source: "demo-1",
    target: "demo-2",
    type: "labeled",
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  },
  {
    id: "e1-3",
    source: "demo-1",
    target: "demo-3",
    type: "labeled",
    data: { arrowEnd: true },
    markerEnd: EDGE_MARKER,
  },
];
