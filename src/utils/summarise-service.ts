import {
  dbClearSummary,
  dbGetGraph,
  dbGetResult,
  dbGetSummaryStatus,
  dbSaveGraph,
  dbSaveResult,
  dbSetError,
} from "@/lib/db/actions/summary";
import type { ConceptMeta, ShotData, SummariseResult } from "@/types/summarise";
import type { MindMapGraph } from "@/utils/mindmap-export";

// Re-export so callers don't need to change their import path.
export type { SummariseResult };

// One scene in the backend storyboard breakdown.
interface SceneApiResponse {
  scene: string;
  description: string;
  visual: string;
  audio: string;
  script: string;
}

// Shape returned by `POST /api/v1/summary`.
interface SummaryApiResponse {
  scenes: SceneApiResponse[];
}

type SummariseStatus = "pending" | "done" | "error";

// Same-origin Next.js route handler that proxies to the backend server-side.
const SUMMARY_ENDPOINT = "/api/v1/summary";
const REQUEST_TIMEOUT_MS = 150000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

// ── In-memory status cache (sync snapshot for useSyncExternalStore) ──────────
// Keyed by clientId. Populated on first fetch and updated after every mutation.
// Empty on fresh page load — callers must call initSummaryStatus to warm it.
const statusCache = new Map<string, SummariseStatus | null>();

// In-flight request handles — survive route changes within the same tab session.
const pendingRequests = new Map<string, Promise<SummariseResult>>();

const statusListeners = new Set<() => void>();

function notifyStatusListeners(): void {
  for (const cb of statusListeners) cb();
}

function setCacheStatus(
  clientId: string,
  status: SummariseStatus | null,
): void {
  if (status === null) statusCache.delete(clientId);
  else statusCache.set(clientId, status);
  notifyStatusListeners();
}

export function getSummaryStatus(clientId: string): SummariseStatus | null {
  return statusCache.get(clientId) ?? null;
}

export function subscribeSummaryStatus(cb: () => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

// Warms the cache from DB on mount — call when the component that uses
// useSyncExternalStore first renders (e.g. CreativeHelperSidebar).
export async function initSummaryStatus(clientId: string): Promise<void> {
  if (statusCache.has(clientId)) return; // already warmed
  const status = await dbGetSummaryStatus(clientId);
  setCacheStatus(clientId, status);
}

// ── scenes → shot rows ─────────────────────────────────────────────────────

function sceneToRow(scene: SceneApiResponse, i: number): ShotData {
  const lines = scene.script
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    shotNumber: i + 1,
    time: undefined,
    description: scene.description,
    shootingStyle: scene.visual || "—",
    audio: scene.audio || "—",
    script: lines.length > 0 ? lines : [scene.script],
  };
}

function mapResponse(res: SummaryApiResponse): SummariseResult {
  return {
    meta: { projectName: "Your Idea" } as ConceptMeta,
    shots: (res.scenes ?? []).map(sceneToRow),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function attemptSummary(graph: MindMapGraph): Promise<SummariseResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(SUMMARY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph: JSON.stringify(graph) }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const err = new Error(`summary failed (${res.status}): ${detail}`);
      (err as Error & { retryable?: boolean }).retryable = isRetryable(
        res.status,
      );
      throw err;
    }
    const json = (await res.json()) as SummaryApiResponse;
    return mapResponse(json);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      const e = new Error("The summary took too long to generate.");
      (e as Error & { retryable?: boolean }).retryable = true;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSummary(graph: MindMapGraph): Promise<SummariseResult> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptSummary(graph);
    } catch (err) {
      lastErr = err;
      const retryable =
        (err as Error & { retryable?: boolean }).retryable ?? true;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("summary request failed");
}

function run(graph: MindMapGraph, clientId: string): Promise<SummariseResult> {
  const p = fetchSummary(graph)
    .then((result) => {
      dbSaveResult(clientId, result).catch(console.error);
      setCacheStatus(clientId, "done");
      pendingRequests.delete(clientId);
      return result;
    })
    .catch((err: unknown) => {
      dbSetError(clientId).catch(console.error);
      setCacheStatus(clientId, "error");
      pendingRequests.delete(clientId);
      throw err instanceof Error ? err : new Error("summary request failed");
    });
  pendingRequests.set(clientId, p);
  return p;
}

// Called from the mind-map "Finalise" action. Snapshots graph to DB and starts
// the request. Fire-and-forget from the caller.
export async function submitMindMap(
  graph: MindMapGraph,
  clientId: string,
): Promise<void> {
  setCacheStatus(clientId, "pending");
  await dbSaveGraph(clientId, graph);
  run(graph, clientId);
}

// Called from the summarise page. Returns the result promise (or null = not
// submitted). Survives reloads via the DB-persisted graph + status.
export async function resumeSummary(
  clientId: string,
): Promise<SummariseResult | null> {
  // In-flight this session — return the same promise.
  const inflight = pendingRequests.get(clientId);
  if (inflight) return inflight;

  const status = await dbGetSummaryStatus(clientId);
  setCacheStatus(clientId, status);

  if (!status) return null;

  if (status === "done") {
    const saved = await dbGetResult(clientId);
    if (saved) return saved;
  }

  // pending (interrupted reload) or error → re-issue from saved graph snapshot.
  const graph = await dbGetGraph(clientId);
  if (!graph) return null;
  return run(graph, clientId);
}

// Returns the persisted summary result for plan generation.
export async function getSummaryResult(
  clientId: string,
): Promise<SummariseResult | null> {
  return dbGetResult(clientId);
}

// Clear a finished/failed job so the user can start a new one.
export async function clearSummary(clientId: string): Promise<void> {
  pendingRequests.delete(clientId);
  setCacheStatus(clientId, null);
  await dbClearSummary(clientId);
}
