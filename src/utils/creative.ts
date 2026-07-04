import type { CreativeFolder, Platform } from "@/types/creative";
import { storage } from "@/utils/storage";

// Platforms offered in the create-project modal, with display labels.
export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
];

export function platformLabel(platform: Platform | undefined): string {
  return PLATFORMS.find((p) => p.id === platform)?.label ?? "";
}

const KEYS = {
  folders: "bistro_creative_folders",
  guideSeen: "bistro_creative_guide_seen",
  draft: "bistro_creative_draft_",
} as const;

const SEED_FOLDERS: CreativeFolder[] = [
  { id: "f-default", name: "My Scripts", scriptIds: [] },
];

const safeGet = <T>(key: string, seed: T): T => storage.read(key, seed);
const safeSet = <T>(key: string, value: T): void => storage.write(key, value);
const safeRemove = (key: string): void => storage.remove(key);

export function getFolders(): CreativeFolder[] {
  return safeGet(KEYS.folders, SEED_FOLDERS);
}

export function saveFolders(folders: CreativeFolder[]): void {
  safeSet(KEYS.folders, folders);
}

export interface ScriptDraft {
  name: string;
  goal: string;
  platform: Platform | "";
}

export const EMPTY_DRAFT: ScriptDraft = { name: "", goal: "", platform: "" };

// ── Create-project draft persistence (per folder) ──────────────────────────
// Keeps the in-progress modal answers so closing and reopening restores them.
// Cleared on submit, when the draft becomes a real script.

export function getDraft(folderId: string): ScriptDraft | null {
  return safeGet<ScriptDraft | null>(`${KEYS.draft}${folderId}`, null);
}

export function saveDraft(folderId: string, draft: ScriptDraft): void {
  safeSet(`${KEYS.draft}${folderId}`, draft);
}

export function clearDraft(folderId: string): void {
  safeRemove(`${KEYS.draft}${folderId}`);
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
