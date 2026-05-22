export type ScriptColor = "blue" | "yellow" | "pink";

export interface CreativeScript {
  id: string;
  title: string;
  body: string;
  folderId: string;
  mindmapId?: string;
  createdAt: string;
  emoji?: string;
  colorTag?: ScriptColor;
  purpose?: string;
  intro?: string;
  outro?: string;
}

export interface CreativeFolder {
  id: string;
  name: string;
  scriptIds: string[];
}
