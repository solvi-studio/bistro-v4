// Video → mind-map analysis service.
//
// Calls POST /api/v1/video-mindmap: scrapes a TikTok video and returns topic
// suggestions grouped by the four mind-map hubs. Uses the same timeout + retry
// ("rebounce") shape as summarise-service so a slow/cold backend call can be
// retried instead of failing outright.
//
// Successful results are cached in local storage keyed by (url + prompt). The
// backend call is expensive (scrape + LLM) so re-analysing the same input
// reuses the cached result instead of hitting the network again.

import { storage } from "@/utils/storage";

export interface VideoMindmapResult {
  nodeId: string;
  bigPicture: string[];
  toneAndMood: string[];
  targetAudience: string[];
  composition: string[];
}

// Shape returned by `POST /api/v1/video-mindmap`.
interface VideoMindmapApiResponse {
  node_id: string;
  big_picture: string[];
  tone_and_mood: string[];
  target_audience: string[];
  composition: string[];
}

// Same-origin Next.js route handler that proxies to the backend server-side.
// The real backend URL (API_URL) never reaches the browser.
const ENDPOINT = "/api/v1/video-mindmap";
// TikTok scrape + Gemini analysis + Cloud Run cold start can take well over a
// minute — keep under the Cloud Run request limit (300s) but long enough not to
// abort a healthy-but-slow call.
const REQUEST_TIMEOUT_MS = 250000;
// One automatic retry smooths over cold starts and transient network blips.
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Result cache (local storage) ────────────────────────────────────────────
// Cached payload omits nodeId — the same analysis can be reused by any node.
type CachedResult = Omit<VideoMindmapResult, "nodeId">;
const CACHE_PREFIX = "bistro_videomindmap_";

// djb2 — keep the storage key short and stable regardless of url/prompt length.
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function cacheKey(url: string, prompt: string): string {
  return `${CACHE_PREFIX}${hash(`${url.trim()}\n${prompt.trim()}`)}`;
}

// 4xx (except 408/429) are caller errors — retrying won't help.
function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function mapResponse(res: VideoMindmapApiResponse): VideoMindmapResult {
  return {
    nodeId: res.node_id,
    bigPicture: res.big_picture ?? [],
    toneAndMood: res.tone_and_mood ?? [],
    targetAudience: res.target_audience ?? [],
    composition: res.composition ?? [],
  };
}

async function attempt(
  nodeId: string,
  tiktokUrl: string,
  userPrompt: string,
): Promise<VideoMindmapResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        tiktok_url: tiktokUrl,
        user_prompt: userPrompt,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const err = new Error(`video analysis failed (${res.status}): ${detail}`);
      // Tag so the retry loop knows whether to bother.
      (err as Error & { retryable?: boolean }).retryable = isRetryable(
        res.status,
      );
      throw err;
    }
    const json = (await res.json()) as VideoMindmapApiResponse;
    return mapResponse(json);
  } catch (err) {
    // Our own timeout surfaces as an AbortError — relabel it clearly.
    if (err instanceof DOMException && err.name === "AbortError") {
      const e = new Error("The video took too long to analyse.");
      (e as Error & { retryable?: boolean }).retryable = true;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Returns a previously cached analysis for this url+prompt, or null. Lets the
// caller know up-front whether an analyse would be free (no backend call).
export function getCachedVideoMindmap(
  nodeId: string,
  tiktokUrl: string,
  userPrompt: string,
): VideoMindmapResult | null {
  const cached = storage.read<CachedResult | null>(
    cacheKey(tiktokUrl, userPrompt),
    null,
  );
  return cached ? { nodeId, ...cached } : null;
}

// Analyse a TikTok video into mind-map topic suggestions.
//   • Returns the cached result for this url+prompt when present (no network),
//     unless `force` is set.
//   • Otherwise calls the backend, retrying once on transient failures.
//   • Caches successful results so the same input never re-hits the backend.
// Throws on permanent failure so the caller can offer a manual retry.
export async function analyzeVideoMindmap(
  nodeId: string,
  tiktokUrl: string,
  userPrompt: string,
  options: { force?: boolean } = {},
): Promise<VideoMindmapResult> {
  const key = cacheKey(tiktokUrl, userPrompt);

  if (!options.force) {
    const cached = storage.read<CachedResult | null>(key, null);
    if (cached) return { nodeId, ...cached };
  }

  let lastErr: unknown;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    try {
      const result = await attempt(nodeId, tiktokUrl, userPrompt);
      const { nodeId: _omit, ...payload } = result;
      storage.write<CachedResult>(key, payload);
      return result;
    } catch (err) {
      lastErr = err;
      const retryable =
        (err as Error & { retryable?: boolean }).retryable ?? true; // network errors have no flag → retry
      if (!retryable || n === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("video analysis request failed");
}

// Basic TikTok share-link check — accepts the common URL forms.
export function isTikTokUrl(url: string): boolean {
  return /https?:\/\/([\w-]+\.)?tiktok\.com\//i.test(url.trim());
}
