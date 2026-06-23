import { NextResponse } from "next/server";

// Server-only backend base (the ad-crawler service). Intentionally NOT prefixed
// with NEXT_PUBLIC_ so the URL never ships to the browser — every backend call
// is funnelled through these route handlers instead of hitting it from the client.
const API_URL = process.env.API_URL ?? "";

// Forward a JSON POST to the upstream backend and relay its response verbatim.
// `path` is the upstream path, e.g. "/api/v1/summary".
export async function proxyJsonPost(
  request: Request,
  path: string,
): Promise<Response> {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL is not configured on the server" },
      { status: 500 },
    );
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the backend service" },
      { status: 502 },
    );
  }

  // Relay status + body as-is so the client's existing error handling and retry
  // logic keep working unchanged.
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
