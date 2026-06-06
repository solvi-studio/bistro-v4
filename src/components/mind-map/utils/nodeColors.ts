import type { Node } from "@xyflow/react";
import {
  getHubPalette,
  IDEA_PALETTE,
  type NodePalette,
} from "@/components/mind-map/constants/topics";
import type { ShapeData } from "@/components/mind-map/nodes/ShapeNode";
import type { StickyData } from "@/components/mind-map/nodes/StickyNode";

// Read the representative theme color of a node, used as the source palette
// when a child inherits color on connect.
export function getNodeThemeColor(node: Node): NodePalette {
  // Anchors (idea + hubs) advertise the leaf palette they hand to children.
  const hubPalette = getHubPalette(node.id);
  if (hubPalette) return hubPalette;

  switch (node.type) {
    case "sticky":
      return {
        bg: (node.data as StickyData).color ?? "#fef9c3",
        text: "#1a1a1a",
      };
    case "shape":
      return {
        bg: (node.data as ShapeData).fillColor ?? "#ffffff",
        text: "#1a1a1a",
      };
    default: {
      // Leaf / default nodes carry their color on the inline style.
      const style = (node.style ?? {}) as {
        background?: string;
        color?: string;
      };
      return {
        bg: typeof style.background === "string" ? style.background : "#ededed",
        text: typeof style.color === "string" ? style.color : "#4b5563",
      };
    }
  }
}

// Produce the patch that re-colors `node` to the given palette, branching on
// node type so the color lands on the right field.
export function applyColorToNode(
  node: Node,
  palette: NodePalette,
): Partial<Node> {
  switch (node.type) {
    case "sticky":
      return { data: { ...node.data, color: palette.bg } };
    case "shape":
      return { data: { ...node.data, fillColor: palette.bg } };
    case "textbox":
      // Text boxes have no fill — tint the text instead.
      return { style: { ...node.style, color: palette.text } };
    default:
      return {
        style: { ...node.style, background: palette.bg, color: palette.text },
      };
  }
}

// Default fallback palette when no anchor is involved.
export const DEFAULT_PALETTE: NodePalette = IDEA_PALETTE;
