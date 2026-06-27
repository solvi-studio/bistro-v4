import type { CSSProperties } from "react";

export const IDEA_ID = "idea";
export const IDEA_POS = { x: 430, y: 320 };

// ── Content category type (shared by ContentNode, SceneNode, sidebar) ─────────

export type ContentCategory = "visual" | "audio" | "script";

export const CATEGORY_THEME: Record<
  ContentCategory,
  { headerBg: string; headerText: string; bodyText: string }
> = {
  visual: { headerBg: "#fbe0e1", headerText: "#d6494e", bodyText: "#6b2b2e" },
  audio:  { headerBg: "#e3ecfb", headerText: "#3b6fd4", bodyText: "#2a3f6b" },
  script: { headerBg: "#fbeec6", headerText: "#b08400", bodyText: "#6b5410" },
};

export interface TopicSection {
  /** Optional sub-heading shown above the items (e.g. "Format"). */
  label?: string;
  items: string[];
  /** Whether an "Add Your Own" input is offered for this section. */
  allowAdd: boolean;
}

export interface MindMapGroup {
  hubId: string;
  hubLabel: string;
  hubBg: string;
  hubPos: { x: number; y: number };
  /** Direction leaves stagger from the hub: -1 = left, 1 = right. */
  leafDir: -1 | 1;
  leafBg: string;
  leafText: string;
  /** body text colour for content nodes spawned from this group */
  bodyText: string;
  /** Maps to a ContentCategory for non-script groups (undefined for fromScript). */
  category?: ContentCategory;
  /** When true, sections are derived at runtime from the active script. */
  fromScript?: boolean;
  sections: TopicSection[];
}

// The 4 hub nodes that ring the central idea node.
export const MIND_MAP_GROUPS: MindMapGroup[] = [
  {
    hubId: "hub-bigpicture",
    hubLabel: "Your Big Picture",
    hubBg: "#e5484d",
    hubPos: { x: 800, y: 320 },
    leafDir: 1,
    leafBg: "#fbe0e1",
    leafText: "#d6494e",
    bodyText: "#6b2b2e",
    fromScript: true,
    sections: [],
  },
  {
    hubId: "hub-visual",
    hubLabel: "Visual",
    hubBg: "#1f2430",
    hubPos: { x: 120, y: 90 },
    leafDir: -1,
    leafBg: "#fbe0e1",
    leafText: "#d6494e",
    bodyText: "#6b2b2e",
    category: "visual",
    sections: [
      {
        items: ["Scene Description", "Shooting Style"],
        allowAdd: true,
      },
    ],
  },
  {
    hubId: "hub-audio",
    hubLabel: "Audio",
    hubBg: "#1f2430",
    hubPos: { x: 90, y: 320 },
    leafDir: -1,
    leafBg: "#e3ecfb",
    leafText: "#3b6fd4",
    bodyText: "#2a3f6b",
    category: "audio",
    sections: [
      {
        items: ["Voiceover", "Trending Music", "Sound Effect"],
        allowAdd: true,
      },
    ],
  },
  {
    hubId: "hub-script",
    hubLabel: "Script",
    hubBg: "#1f2430",
    hubPos: { x: 120, y: 550 },
    leafDir: -1,
    leafBg: "#fbeec6",
    leafText: "#b08400",
    bodyText: "#6b5410",
    category: "script",
    sections: [
      {
        items: ["Concept Writing", "Timing"],
        allowAdd: true,
      },
    ],
  },
];

/** Returns the option items for a given content category (from the matching hub). */
export function categoryOptions(category: ContentCategory): string[] {
  const group = MIND_MAP_GROUPS.find((g) => g.category === category);
  return group?.sections.flatMap((s) => s.items) ?? [];
}

// ── Anchor (locked) nodes ───────────────────────────────────────────────────
// Only the central idea (Scene 1) is locked — it can't be deleted or erased.
export const ANCHOR_NODE_IDS: ReadonlySet<string> = new Set([IDEA_ID]);

export interface NodePalette {
  bg: string;
  text: string;
}

// Visual theme of the central idea node (used for color inheritance).
export const IDEA_PALETTE: NodePalette = { bg: "#3b7cf4", text: "#ffffff" };

// The leaf palette a hub passes down to its children. Idea node → IDEA_PALETTE.
export function getHubPalette(nodeId: string): NodePalette | null {
  if (nodeId === IDEA_ID) return IDEA_PALETTE;
  const group = MIND_MAP_GROUPS.find((g) => g.hubId === nodeId);
  return group ? { bg: group.leafBg, text: group.leafText } : null;
}

export function ideaNodeStyle(): CSSProperties {
  return {
    background: "#3b7cf4",
    color: "#ffffff",
    border: "none",
    borderRadius: 16,
    padding: "14px 26px",
    fontSize: 17,
    fontWeight: 700,
    boxShadow: "0 4px 10px rgba(59,124,244,0.35)",
  };
}

export function hubNodeStyle(bg: string): CSSProperties {
  return {
    background: bg,
    color: "#ffffff",
    border: "none",
    borderRadius: 14,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  };
}

export function leafNodeStyle(bg: string, text: string): CSSProperties {
  return {
    background: bg,
    color: text,
    border: "none",
    borderRadius: 999,
    padding: "24px 32px",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  };
}
