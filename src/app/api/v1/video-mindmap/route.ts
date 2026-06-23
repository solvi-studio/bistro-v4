import { proxyJsonPost } from "../_lib/proxy";

// TikTok scrape + Gemini analysis + Cloud Run cold start can be slow — allow a
// long server execution window (Cloud Run request limit is 300s).
export const maxDuration = 300;
export const runtime = "nodejs";

export function POST(request: Request) {
  return proxyJsonPost(request, "/api/v1/video-mindmap");
}
