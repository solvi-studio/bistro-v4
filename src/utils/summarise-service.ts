import type { ConceptMeta, ShotData } from "@/types/summarise";
import type { MindMapGraph } from "@/utils/mindmap-export";
import { storage } from "@/utils/storage";

// Result the summarise page renders.
export interface SummariseResult {
  meta: ConceptMeta;
  shots: ShotData[];
}

// One shot row in the backend storyboard.
interface ShotApiResponse {
  description: string;
  shooting_style: string;
  camera_angle: string;
  script: string;
}

// Shape returned by `POST /api/v1/summary`.
interface SummaryApiResponse {
  concept: string;
  tone_of_voice: string;
  target_audience: string;
  storyboard: ShotApiResponse[];
}

type SummariseStatus = "pending" | "done" | "error";

// Same-origin Next.js route handler that proxies to the backend server-side.
// The real backend URL (API_URL) never reaches the browser.
const SUMMARY_ENDPOINT = "/api/v1/summary";
// Gemini summary + Cloud Run cold start can take well over a minute — keep this
// comfortably under the Cloud Run request limit (300s) but long enough not to
// abort a healthy-but-slow call.
const REQUEST_TIMEOUT_MS = 150000;
// One automatic retry smooths over cold starts and transient network blips.
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

// Persisted so a page reload can resume the job (graph snapshot + status, plus
// the result once it lands). Routed through the storage seam — swappable to a
// DB later without touching call sites.
const STATUS_KEY = "bistro_summarise_status";
const GRAPH_KEY = "bistro_summarise_graph";
const RESULT_KEY = "bistro_summarise_result";

// In-memory handle for the request in flight *this* session. After a reload it
// is gone, and we rebuild it from the persisted graph instead.
let pending: Promise<SummariseResult> | null = null;

// ── Status accessor + change subscription ───────────────────────────────────
// The creative-flow sidebar gates the Summarise/Plan tabs on this status. Same-
// tab storage writes don't fire `storage` events, so notify subscribers here.
const statusListeners = new Set<() => void>();

function setStatus(status: SummariseStatus | null): void {
  if (status === null) storage.remove(STATUS_KEY);
  else storage.write<SummariseStatus>(STATUS_KEY, status);
  for (const cb of statusListeners) cb();
}

export function getSummaryStatus(): SummariseStatus | null {
  return storage.read<SummariseStatus | null>(STATUS_KEY, null);
}

export function subscribeSummaryStatus(cb: () => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

// ── storyboard → shot rows ─────────────────────────────────────────────────
// The endpoint now returns structured shots. Map each onto a ShotData row;
// `script` is a single string backend-side, so wrap it for the table's
// line-per-entry rendering (split on newlines when present).
function shotToRow(shot: ShotApiResponse, i: number): ShotData {
  const lines = shot.script
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    shotNumber: i + 1,
    description: shot.description,
    shootingStyle: shot.shooting_style || "—",
    cameraAngle: shot.camera_angle || "—",
    script: lines.length > 0 ? lines : [shot.script],
  };
}

function mapResponse(res: SummaryApiResponse): SummariseResult {
  return {
    meta: {
      concept: res.concept,
      tone: res.tone_of_voice,
      targetAudience: res.target_audience,
      projectName: "Your Idea",
    },
    shots: (res.storyboard ?? []).map(shotToRow),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 4xx (except 408/429) are caller errors — retrying won't help.
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
      // Tag so the retry loop knows whether to bother.
      (err as Error & { retryable?: boolean }).retryable = isRetryable(
        res.status,
      );
      throw err;
    }
    const json = (await res.json()) as SummaryApiResponse;
    return mapResponse(json);
  } catch (err) {
    // Our own timeout surfaces as an AbortError — relabel it clearly.
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
        (err as Error & { retryable?: boolean }).retryable ?? true; // network errors have no flag → retry
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("summary request failed");
}

// Run the request and persist status + result as it resolves, so a reload can
// pick up the outcome.
function run(graph: MindMapGraph): Promise<SummariseResult> {
  return fetchSummary(graph)
    .then((result) => {
      storage.write<SummariseResult>(RESULT_KEY, result);
      setStatus("done");
      return result;
    })
    .catch((err: unknown) => {
      setStatus("error");
      throw err instanceof Error ? err : new Error("summary request failed");
    });
}

// Called from the mind-map "Finalise" action. Snapshots the graph and kicks
// off the request.
export function submitMindMap(graph: MindMapGraph): void {
  storage.write<MindMapGraph>(GRAPH_KEY, graph);
  storage.remove(RESULT_KEY);
  setStatus("pending");
  pending = run(graph);
}

// Called from the summarise page. Returns a promise for the result, surviving
// reloads:
//   • request in flight this session → return it
//   • finished in a prior session    → resolve the stored result
//   • pending/error after a reload   → re-issue from the saved graph snapshot
//   • never submitted                → null (page bounces back to the canvas)
export function resumeSummary(): Promise<SummariseResult> | null {
  if (pending) return pending;

  const status = storage.read<SummariseStatus | null>(STATUS_KEY, null);
  if (!status) return null;

  if (status === "done") {
    const saved = storage.read<SummariseResult | null>(RESULT_KEY, null);
    if (saved) return Promise.resolve(saved);
  }

  // pending (interrupted by reload) or error → retry from the snapshot.
  const graph = storage.read<MindMapGraph | null>(GRAPH_KEY, null);
  if (!graph) return null;
  pending = run(graph);
  return pending;
}

// Clear a finished/failed job (e.g. when the user starts a fresh idea).
export function clearSummary(): void {
  pending = null;
  storage.remove(GRAPH_KEY);
  storage.remove(RESULT_KEY);
  setStatus(null);
}
