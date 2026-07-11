// Video → mind-map analysis service.
//
// Calls POST /api/v1/video-mindmap: scrapes a TikTok video and returns one
// mind-map node per requested analysis type.
//
// Single attempt, no client-side retry: the backend route charges 1 of the
// user's video-analysis quota slots on every hit (route.ts), so retrying here
// would silently burn 2 slots for one user-initiated click. The 250s client /
// 300s server timeout already covers Cloud Run cold starts; a real failure
// surfaces to VideoNode's "Retry" button, which is a new, correctly-charged
// attempt the user explicitly chose.
//
// No result caching here — whether a type needs (re-)analysing is decided by
// checking the video node's actual connected content nodes on the canvas
// (see VideoNode's connectedContentHeaders), not by hashing the request.

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

function mapResponse(res: VideoMindmapApiResponse): VideoMindmapResult {
  return {
    nodeId: res.node_id,
    nodes: res.nodes ?? [],
  };
}

// Analyse a TikTok video into mind-map nodes, one per requested type. Single
// attempt — the caller is responsible for only requesting types that aren't
// already represented on the canvas. Throws on failure so the caller can
// offer a manual retry (see the module comment above for why there's no
// automatic retry here).
export async function analyzeVideoMindmap(
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
      throw new Error(`video analysis failed (${res.status}): ${detail}`);
    }
    const json = (await res.json()) as VideoMindmapApiResponse;
    return mapResponse(json);
  } catch (err) {
    // Our own timeout surfaces as an AbortError — relabel it clearly.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The video took too long to analyse.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Basic TikTok share-link check — accepts the common URL forms.
export function isTikTokUrl(url: string): boolean {
  return /https?:\/\/([\w-]+\.)?tiktok\.com\//i.test(url.trim());
}
