import type {
  CreativeFolder,
  CreativeScript,
  ScriptColor,
} from "@/types/creative";

const KEYS = {
  folders: "bistro_creative_folders",
  scripts: "bistro_creative_scripts",
  guideSeen: "bistro_creative_guide_seen",
} as const;

const SEED_FOLDERS: CreativeFolder[] = [
  { id: "f-default", name: "My Scripts", scriptIds: ["s-1", "s-2"] },
];

const SEED_SCRIPTS: CreativeScript[] = [
  {
    id: "s-1",
    title: "Manly Beach Girl",
    body: "A warm, sun-soaked day-in-the-life vlog around Manly Beach.",
    folderId: "f-default",
    createdAt: "2026-04-22T00:00:00.000Z",
    emoji: "🏖️",
    colorTag: "yellow",
  },
  {
    id: "s-2",
    title: "Strong Body Sesh",
    body: "High-energy gym session edit with punchy cuts and captions.",
    folderId: "f-default",
    createdAt: "2026-04-18T00:00:00.000Z",
    emoji: "💪",
    colorTag: "pink",
  },
];

// Colours cycle through new scripts so the card grid stays varied.
const COLOR_CYCLE: ScriptColor[] = ["blue", "yellow", "pink"];

function safeGet<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function getFolders(): CreativeFolder[] {
  return safeGet(KEYS.folders, SEED_FOLDERS);
}

export function saveFolders(folders: CreativeFolder[]): void {
  safeSet(KEYS.folders, folders);
}

export function getScripts(): CreativeScript[] {
  return safeGet(KEYS.scripts, SEED_SCRIPTS);
}

export function saveScripts(scripts: CreativeScript[]): void {
  safeSet(KEYS.scripts, scripts);
}

export interface ScriptDraft {
  purpose: string;
  intro: string;
  outro: string;
}

/**
 * Create a new script from the compose-page answers, link it to its folder,
 * and persist both. Called only on submit — never on unmount.
 */
export function addScript(
  folderId: string,
  draft: ScriptDraft,
): CreativeScript {
  const folders = getFolders();
  const targetId = folders.some((f) => f.id === folderId)
    ? folderId
    : (folders[0]?.id ?? "f-default");

  const existing = getScripts();
  const firstLine = draft.purpose.trim().split("\n")[0]?.trim() ?? "";
  const title =
    firstLine.length > 0 ? firstLine.slice(0, 48) : "Untitled shotlist";

  const script: CreativeScript = {
    id: `s-${Date.now()}`,
    title,
    body: [draft.purpose, draft.intro, draft.outro]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n\n"),
    folderId: targetId,
    createdAt: new Date().toISOString(),
    emoji: "✨",
    colorTag: COLOR_CYCLE[existing.length % COLOR_CYCLE.length],
    purpose: draft.purpose.trim(),
    intro: draft.intro.trim(),
    outro: draft.outro.trim(),
  };

  saveScripts([...existing, script]);
  saveFolders(
    folders.map((f) =>
      f.id === targetId ? { ...f, scriptIds: [...f.scriptIds, script.id] } : f,
    ),
  );

  return script;
}

export function isGuideSeen(): boolean {
  return safeGet(KEYS.guideSeen, false);
}

export function markGuideSeen(): void {
  safeSet(KEYS.guideSeen, true);
}

/** Format an ISO date as "22 Apr 2026" to match the Figma idea cards. */
export function formatScriptDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
