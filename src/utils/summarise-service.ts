import type { ConceptMeta, ShotData } from "@/types/summarise";
import type { MindMapGraph } from "@/utils/mindmap-export";

// Result the summarise page renders.
export interface SummariseResult {
  meta: ConceptMeta;
  shots: ShotData[];
}

// Shape returned by `POST /api/v1/summary`.
interface SummaryApiResponse {
  concept: string;
  tone_of_voice: string;
  target_audience: string;
  storyboard: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SUMMARY_ENDPOINT = `${API_BASE}/api/v1/summary`;
const REQUEST_TIMEOUT_MS = 30000;
const STATUS_KEY = "bistro_summarise_status";

// In-memory handoff between the mind-map page (submit) and the summarise page
// (consume). Survives client-side navigation; lost on a hard refresh.
let pending: Promise<SummariseResult> | null = null;

function setStatus(value: "pending" | "done" | "error") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATUS_KEY, value);
  } catch {
    // ignore quota errors
  }
}

// Turn the backend storyboard paragraph into shot rows. The summary endpoint
// returns a single storyboard string (no per-shot fields), so each scene line
// becomes one shot. Camera/style columns are left blank — these come from a
// richer endpoint later, not from defaults.
function storyboardToShots(storyboard: string): ShotData[] {
  const scenes = storyboard
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.replace(/^\s*(?:scene|shot)?\s*\d+[).:-]?\s*/i, "").trim())
    .filter((s) => s.length > 0);

  const lines = scenes.length > 0 ? scenes : [storyboard.trim()];

  return lines.map((description, i) => ({
    shotNumber: i + 1,
    description,
    shootingStyle: "—",
    cameraAngle: "—",
    script: [description],
  }));
}

// Map the backend response onto the page's data model.
function mapResponse(res: SummaryApiResponse): SummariseResult {
  return {
    meta: {
      concept: res.concept,
      tone: res.tone_of_voice,
      targetAudience: res.target_audience,
      projectName: "Your Idea",
    },
    shots: storyboardToShots(res.storyboard),
  };
}

async function fetchSummary(graph: MindMapGraph): Promise<SummariseResult> {
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
      throw new Error(`summary failed (${res.status}): ${detail}`);
    }
    const json = (await res.json()) as SummaryApiResponse;
    setStatus("done");
    return mapResponse(json);
  } catch (err) {
    // Surface the failure — no seed fallback. The page shows an error state.
    setStatus("error");
    throw err instanceof Error ? err : new Error("summary request failed");
  } finally {
    clearTimeout(timer);
  }
}

// Called from the mind-map "Finalise" action.
export function submitMindMap(graph: MindMapGraph): void {
  setStatus("pending");
  pending = fetchSummary(graph);
}

// Called from the summarise page. Returns the in-flight (or last) request, or
// null when the user navigated directly without ever submitting. NOT cleared
// here — clearing on read breaks under React Strict Mode's double-invoked
// effects (the second pass would see null and bounce away). The next
// submitMindMap() overwrites it instead.
export function consumePendingSummary(): Promise<SummariseResult> | null {
  return pending;
}
