export type ScriptColor = "blue" | "yellow" | "pink";

// Publishing channel chosen in the create-project modal.
export type Platform = "tiktok" | "youtube" | "instagram";

export interface CreativeScript {
  id: string;
  title: string;
  body: string;
  folderId: string;
  mindmapId?: string;
  createdAt: string;
  emoji?: string;
  colorTag?: ScriptColor;
  // Captured by the create-project modal (Image #2).
  goal?: string;
  platform?: Platform;
  // Legacy compose fields — no longer collected, kept for back-compat reads.
  purpose?: string;
  intro?: string;
  outro?: string;
}

export interface CreativeFolder {
  id: string;
  name: string;
  scriptIds: string[];
}
