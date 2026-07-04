import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureUser, requireUserId } from "@/lib/db/auth";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema/users";
import { proxyJsonPost } from "../_lib/proxy";

// TikTok scrape + Gemini analysis + Cloud Run cold start can be slow — allow a
// long server execution window (Cloud Run request limit is 300s).
export const maxDuration = 300;
export const runtime = "nodejs";

const MAX_GENERATIONS = 5;
const WINDOW_DAYS = 30;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Test/staging domain — exempt from the generation quota (matches the
// host-based test-environment check in src/lib/clerk-config.ts).
const RATE_LIMIT_EXEMPT_HOST = "test.solvi.studio";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureUser(userId);

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isRateLimitExempt = host === RATE_LIMIT_EXEMPT_HOST;

  if (!isRateLimitExempt) {
    const windowCutoff = new Date(Date.now() - WINDOW_MS);

    // Reserve a slot BEFORE calling the (paid, external) backend. Two plain
    // UPDATEs in one transaction: the row lock taken by the first UPDATE holds
    // for the whole transaction, so concurrent requests are serialized safely
    // without needing a separate lock or a single combined CASE expression.
    const reserved = await db.transaction(async (tx) => {
      // Reset if the window has expired.
      await tx
        .update(users)
        .set({ videoAnalysisCount: 0, videoAnalysisWindowStart: null })
        .where(
          and(
            eq(users.id, userId),
            lt(users.videoAnalysisWindowStart, windowCutoff),
          ),
        );

      // Increment only if still under the limit; start the window if this is
      // the first generation (window_start was NULL, possibly just cleared above).
      const [row] = await tx
        .update(users)
        .set({
          videoAnalysisCount: sql`${users.videoAnalysisCount} + 1`,
          videoAnalysisWindowStart: sql`COALESCE(${users.videoAnalysisWindowStart}, NOW())`,
        })
        .where(
          and(
            eq(users.id, userId),
            lt(users.videoAnalysisCount, MAX_GENERATIONS),
          ),
        )
        .returning({ count: users.videoAnalysisCount });

      return row;
    });

    if (!reserved) {
      const [row] = await db
        .select({ windowStart: users.videoAnalysisWindowStart })
        .from(users)
        .where(eq(users.id, userId));
      const windowStart = row?.windowStart ?? new Date();
      const resetAt = new Date(windowStart.getTime() + WINDOW_MS);
      const retryAfterDays = Math.max(
        1,
        Math.ceil((resetAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      );
      return NextResponse.json(
        {
          error: `You've used all ${MAX_GENERATIONS} video analyses. Try again in ${retryAfterDays} day${retryAfterDays === 1 ? "" : "s"}.`,
        },
        { status: 403 },
      );
    }
  }

  return proxyJsonPost(request, "/api/v1/video-mindmap");
}
