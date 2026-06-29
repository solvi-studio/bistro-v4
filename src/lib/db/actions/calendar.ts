"use server";

import "server-only";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/db/auth";
import { db } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";
import type { EnrichedCalendarEvent, PlanTask } from "@/types/plan";

// Single query — all folders for the current user — flatten scheduled tasks into
// EnrichedCalendarEvent[] so the calendar page can display them without N+1 hits.
export async function getCalendarTaskEvents(): Promise<
  EnrichedCalendarEvent[]
> {
  const userId = await requireUserId();
  const rows = await db
    .select({
      clientId: folders.clientId,
      name: folders.name,
      colorTag: folders.colorTag,
      plan: folders.plan,
    })
    .from(folders)
    .where(eq(folders.userId, userId));

  const events: EnrichedCalendarEvent[] = [];
  for (const row of rows) {
    const tasks = (row.plan as PlanTask[] | null) ?? [];
    for (const t of tasks) {
      if (!t.scheduledDate) continue;
      events.push({
        id: `task-${t.id}`,
        scriptId: row.clientId ?? "",
        date: t.scheduledDate,
        time: t.scheduledStartTime,
        endTime: t.scheduledEndTime,
        title: t.text,
        notes: t.notes ?? [],
        location: t.location,
        reminders: t.reminders,
        scriptTitle: row.name ?? "",
        colorTag: (row.colorTag ?? "blue") as "blue" | "yellow" | "pink",
        taskId: t.id,
        phase: t.phase,
      });
    }
  }
  return events;
}
