// Video → mind-map analysis service.
//
// Calls POST /api/v1/video-mindmap: scrapes a TikTok video and returns one
// mind-map node per requested analysis type. Uses the same timeout + retry
// ("rebounce") shape as summarise-service so a slow/cold backend call can be
// retried instead of failing outright.
//
// No result caching here — whether a type needs (re-)analysing is decided by
// checking the video node's actual connected content nodes on the canvas
// (see VideoNode's connectedContentHeaders), not by hashing the request.

export interface VideoMindmapNode {
  type: string;
  content: string;
}

export interface VideoMindmapNode {
  type: string;
  content: string;
}

export interface VideoMindmapResult {
  nodeId: string;
  nodes: VideoMindmapNode[];
}

// Shape returned by `POST /api/v1/video-mindmap`.
interface VideoMindmapApiResponse {
  node_id: string;
  nodes: VideoMindmapNode[];
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

// 4xx (except 408/429) are caller errors — retrying won't help.
function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function mapResponse(res: VideoMindmapApiResponse): VideoMindmapResult {
  return {
    nodeId: res.node_id,
    nodes: res.nodes ?? [],
  };
}

async function attempt(
  nodeId: string,
  tiktokUrl: string,
  types: string[],
  startOffset: number,
  endOffset: number,
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
        types,
        start_offset: startOffset,
        end_offset: endOffset,
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

// Analyse a TikTok video into mind-map nodes, one per requested type.
// Always calls the backend (retrying once on transient failures) — the
// caller is responsible for only requesting types that aren't already
// represented on the canvas.
// Throws on permanent failure so the caller can offer a manual retry.
export async function analyzeVideoMindmap(
  nodeId: string,
  tiktokUrl: string,
  types: string[],
  startOffset: number,
  endOffset: number,
): Promise<VideoMindmapResult> {
  let lastErr: unknown;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    try {
      return await attempt(nodeId, tiktokUrl, types, startOffset, endOffset);
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
