// ─── Node data shapes ─────────────────────────────────────────────────────────

export interface TextBoxNodeData {
  html: string;
  fontSize: "sm" | "md" | "lg" | "xl";
}

export interface ShapeNodeData {
  text: string;
  shape: "rectangle" | "circle" | "ellipse" | "hexagon" | "cloud";
  fillColor: string;
  strokeColor: string;
  fontSize: number;
}

export interface StickyNodeData {
  text: string;
  color: string;
  fontSize: number;
}

export interface DrawingNodeData {
  points: [number, number, number][];
  color: string;
  size: number;
}

// ─── Serialized node ──────────────────────────────────────────────────────────

export type SerializedNodeType = "textbox" | "shape" | "sticky" | "drawing";

export interface SerializedNode {
  id: string;
  type: SerializedNodeType;
  position: { x: number; y: number };
  width: number | undefined;
  height: number | undefined;
  zIndex: number | undefined;
  style: Record<string, unknown> | undefined;
  data: TextBoxNodeData | ShapeNodeData | StickyNodeData | DrawingNodeData;
}

// ─── Serialized edge ──────────────────────────────────────────────────────────

export interface SerializedEdge {
  id: string;
  type: "labeled";
  source: string;
  target: string;
  sourceHandle: string | null | undefined;
  targetHandle: string | null | undefined;
  data: {
    label?: string;
    edgeType?: "smoothstep" | "straight" | "bezier";
    arrowStart?: boolean;
    arrowEnd?: boolean;
  };
  style: Record<string, unknown> | undefined;
}

// ─── Viewport ─────────────────────────────────────────────────────────────────

export interface SerializedViewport {
  x: number;
  y: number;
  zoom: number;
}

// ─── Root schema ──────────────────────────────────────────────────────────────

export interface MindMapFile {
  schemaVersion: 1;
  meta: {
    id: string;
    name: string;
    createdAt: string;
    modifiedAt: string;
  };
  viewport: SerializedViewport;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

// ─── Map index entry ──────────────────────────────────────────────────────────

export interface MapIndexEntry {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  nodeCount: number;
}
