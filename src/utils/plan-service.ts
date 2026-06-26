import type { CalendarEvent, PlanPhase, PlanTask } from "@/types/plan";
import type { SummariseResult } from "@/utils/summarise-service";

// Input the plan request needs: a free-form video summary, plus an optional
// free-form description of the creator's existing weekly commitments.
export interface PlanRequestInput {
  summary: string;
  schedule?: string;
}

// One task row in the backend plan.
interface PlanTaskApiResponse {
  id: string;
  date: string; // ISO 8601 (YYYY-MM-DD)
  start: number; // 24h fractional hours, e.g. 9.0 = 09:00, 13.5 = 13:30
  end: number; // 24h fractional hours, must be > start
  phase: "pre-production" | "production" | "post-production";
  depends_on: string[];
  description: string;
  location: string;
}

// Shape returned by `POST /api/v1/plan-tasks`.
interface PlanTasksApiResponse {
  today: string; // ISO date the plan is anchored to
  tasks: PlanTaskApiResponse[];
}

// Same-origin Next.js route handler that proxies to the backend server-side,
// mirroring the summary flow so the real backend URL never reaches the browser.
const PLAN_ENDPOINT = "/api/v1/plan-tasks";
// Gemini plan generation + Cloud Run cold start can take a while — keep under
// the Cloud Run 300s limit but long enough not to abort a healthy-but-slow call.
const REQUEST_TIMEOUT_MS = 150000;
// One automatic retry smooths over cold starts and transient network blips.
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;
// Defensive caps. The summary/schedule are our own bounded data, but never POST
// an unbounded blob upstream — both Gemini's context and Cloud Run have limits,
// and an oversized body is a cheap abuse vector to refuse early.
const MAX_SUMMARY_CHARS = 20000;
const MAX_SCHEDULE_CHARS = 5000;

// ── field mapping ───────────────────────────────────────────────────────────
// Backend phases are the long form; the board uses the short form.
const PHASE_MAP: Record<PlanTaskApiResponse["phase"], PlanPhase> = {
  "pre-production": "pre",
  production: "production",
  "post-production": "post",
};

// Match the seed-task palette so generated tasks colour like hand-made ones.
const PHASE_COLOR: Record<PlanPhase, PlanTask["colorTag"]> = {
  pre: "pink",
  production: "blue",
  post: "yellow",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Only accept a well-formed ISO date; anything else leaves the task unscheduled
// rather than poisoning calendar grouping with a junk key.
function safeIsoDate(d: string): string | undefined {
  return ISO_DATE.test(d) ? d : undefined;
}

// Fractional hours (9.0, 13.5) → "HH:MM". Returns undefined for out-of-range or
// non-finite input so a bad value just leaves the time unset instead of
// rendering "NaN:NaN". Rolls 59.5min rounding up into the next hour.
function hoursToHHMM(h: number): string | undefined {
  if (!Number.isFinite(h) || h < 0 || h >= 24) return undefined;
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    hh += 1;
    mm = 0;
  }
  if (hh >= 24) return undefined;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Map one backend task onto a board PlanTask. `depends_on` and `location` have
// no slot on PlanTask, so they are dropped here — surface them via CalendarEvent
// (which has `location`) if/when needed.
function taskToBoard(t: PlanTaskApiResponse): PlanTask {
  const phase = PHASE_MAP[t.phase] ?? "pre";
  return {
    id: t.id,
    text: t.description,
    scheduledDate: safeIsoDate(t.date),
    scheduledStartTime: hoursToHHMM(t.start),
    scheduledEndTime: hoursToHHMM(t.end),
    completed: false,
    colorTag: PHASE_COLOR[phase],
    phase,
  };
}

function mapResponse(res: PlanTasksApiResponse): PlanTask[] {
  return (res.tasks ?? []).map(taskToBoard);
}

// ── input serialisers ───────────────────────────────────────────────────────
// Turn the completed summary into the free-form text the planner consumes. The
// backend planner takes a single string, so flatten the storyboard into one.
export function buildPlanSummary(result: SummariseResult): string {
  const { meta, shots } = result;
  const lines = [`Project: ${meta.projectName}`];
  for (const s of shots) {
    lines.push(
      `Shot ${s.shotNumber}: ${s.description} | Shooting style: ${s.shootingStyle} | Audio: ${s.audio} | Script: ${s.script.join(" ")}`,
    );
  }
  return lines.join("\n").slice(0, MAX_SUMMARY_CHARS);
}

// Turn the folder's existing calendar events into the "existing commitments"
// block the planner uses to avoid clashing/out-of-place task placement.
export function buildScheduleText(events: CalendarEvent[]): string | undefined {
  if (events.length === 0) return undefined;
  const lines = events.map((e) => {
    const when = e.time
      ? `${e.date} ${e.time}${e.endTime ? `-${e.endTime}` : ""}`
      : e.date;
    const loc = e.location ? ` @ ${e.location}` : "";
    return `- ${when}: ${e.title}${loc}`;
  });
  return lines.join("\n").slice(0, MAX_SCHEDULE_CHARS);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 4xx (except 408/429) are caller errors — retrying won't help.
function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function attemptPlan(input: PlanRequestInput): Promise<PlanTask[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(PLAN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: input.summary,
        schedule: input.schedule,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const err = new Error(`plan failed (${res.status}): ${detail}`);
      // Tag so the retry loop knows whether to bother.
      (err as Error & { retryable?: boolean }).retryable = isRetryable(
        res.status,
      );
      throw err;
    }
    const json = (await res.json()) as PlanTasksApiResponse;
    return mapResponse(json);
  } catch (err) {
    // Our own timeout surfaces as an AbortError — relabel it clearly.
    if (err instanceof DOMException && err.name === "AbortError") {
      const e = new Error("The plan took too long to generate.");
      (e as Error & { retryable?: boolean }).retryable = true;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Generate a dated, dependency-ordered task plan from a summary (+ optional
// schedule). Pure fetch + map: the caller owns persistence (savePlanTasks),
// keeping a single per-script source of truth that maps cleanly to a DB row.
export async function generatePlanTasks(
  input: PlanRequestInput,
): Promise<PlanTask[]> {
  if (!input.summary.trim()) {
    throw new Error("Cannot generate a plan without a summary.");
  }

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptPlan(input);
    } catch (err) {
      lastErr = err;
      const retryable =
        (err as Error & { retryable?: boolean }).retryable ?? true; // network errors have no flag → retry
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("plan request failed");
}
