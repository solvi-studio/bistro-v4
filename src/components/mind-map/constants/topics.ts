import type { CSSProperties } from "react";

export const IDEA_ID = "idea";
export const IDEA_POS = { x: 430, y: 320 };

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
  /** When true, sections are derived at runtime from the active script. */
  fromScript?: boolean;
  sections: TopicSection[];
}

// The 4 required hub nodes that ring the central idea node. Every panel-spawned
// topic node attaches to one of these hubs.
export const MIND_MAP_GROUPS: MindMapGroup[] = [
  {
    hubId: "hub-bigpicture",
    hubLabel: "Your Big Picture",
    hubBg: "#e5484d",
    hubPos: { x: 800, y: 320 },
    leafDir: 1,
    leafBg: "#fbe0e1",
    leafText: "#d6494e",
    fromScript: true,
    sections: [],
  },
  {
    hubId: "hub-composition",
    hubLabel: "Composition",
    hubBg: "#1f2430",
    hubPos: { x: 120, y: 90 },
    leafDir: -1,
    leafBg: "#e3ecfb",
    leafText: "#3b6fd4",
    sections: [
      {
        label: "Format",
        items: ["Short-form 60 secs", "Live Stream", "Video Series"],
        allowAdd: true,
      },
      {
        label: "Type of Shooting",
        items: ["Wide shot", "Close up", "Shoulder Level"],
        allowAdd: true,
      },
    ],
  },
  {
    hubId: "hub-tone",
    hubLabel: "Tone & Mood",
    hubBg: "#1f2430",
    hubPos: { x: 90, y: 320 },
    leafDir: -1,
    leafBg: "#ededed",
    leafText: "#4b5563",
    sections: [
      {
        items: ["Warm & soft", "Energetic", "Calm & cinematic", "Playful"],
        allowAdd: true,
      },
    ],
  },
  {
    hubId: "hub-audience",
    hubLabel: "Target Audience",
    hubBg: "#1f2430",
    hubPos: { x: 120, y: 550 },
    leafDir: -1,
    leafBg: "#ededed",
    leafText: "#4b5563",
    sections: [
      {
        items: ["Lifestyle GenZ", "Fitness enthusiasts", "Travel lovers"],
        allowAdd: true,
      },
    ],
  },
];

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
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    maxWidth: 210,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  };
}
