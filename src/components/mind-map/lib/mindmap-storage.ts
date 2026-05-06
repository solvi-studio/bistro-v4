import { MindMapFile, MapIndexEntry } from "@/components/mind-map/types/mindmap-schema";

const KEY_INDEX = "bistro:mm:index";
const KEY_ACTIVE = "bistro:mm:active";
const mapKey = (id: string) => `bistro:mm:map:${id}`;

// ─── Index ────────────────────────────────────────────────────────────────────

export function getMapIndex(): MapIndexEntry[] {
  try {
    const raw = localStorage.getItem(KEY_INDEX);
    if (!raw) return [];
    return JSON.parse(raw) as MapIndexEntry[];
  } catch {
    return [];
  }
}

export function updateMapIndex(entry: MapIndexEntry): void {
  const index = getMapIndex();
  const i = index.findIndex((e) => e.id === entry.id);
  if (i >= 0) {
    index[i] = entry;
  } else {
    index.push(entry);
  }
  localStorage.setItem(KEY_INDEX, JSON.stringify(index));
}

// ─── Per-map data ─────────────────────────────────────────────────────────────

export function readMap(id: string): MindMapFile | null {
  try {
    const raw = localStorage.getItem(mapKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as MindMapFile;
  } catch {
    return null;
  }
}

export function writeMap(file: MindMapFile): void {
  localStorage.setItem(mapKey(file.meta.id), JSON.stringify(file));
  updateMapIndex({
    id: file.meta.id,
    name: file.meta.name,
    createdAt: file.meta.createdAt,
    modifiedAt: file.meta.modifiedAt,
    nodeCount: file.nodes.length,
  });
}

export function deleteMap(id: string): void {
  localStorage.removeItem(mapKey(id));
  const index = getMapIndex().filter((e) => e.id !== id);
  localStorage.setItem(KEY_INDEX, JSON.stringify(index));
}

// ─── Active map ───────────────────────────────────────────────────────────────

export function getActiveMapId(): string | null {
  return localStorage.getItem(KEY_ACTIVE);
}

export function setActiveMapId(id: string): void {
  localStorage.setItem(KEY_ACTIVE, id);
}
