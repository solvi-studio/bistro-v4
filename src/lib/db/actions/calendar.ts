"use server";

import "server-only";
import { eq } from "drizzle-orm";
import { getPlanTasks, savePlanTasks } from "@/lib/db/actions/plan";
import { requireUserId } from "@/lib/db/auth";
import { getDb } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";
import type { EnrichedCalendarEvent, PlanTask } from "@/types/plan";

// Single query — all folders for the current user — flatten scheduled tasks into
// EnrichedCalendarEvent[] so the calendar page can display them without N+1 hits.
export async function getCalendarTaskEvents(): Promise<
  EnrichedCalendarEvent[]
> {
  const userId = await requireUserId();
  const rows = await getDb()
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
        notes: t.notes ?? "",
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

// Patches one task inside a folder's plan array — used when a task-derived
// calendar event's notes/location/reminders/time are edited from the
// calendar page's detail panel (as opposed to the Plan board).
export async function updateTaskFromCalendar(
  clientId: string,
  taskId: string,
  patch: Partial<PlanTask>,
): Promise<void> {
  const tasks = await getPlanTasks(clientId);
  const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
  await savePlanTasks(clientId, updated);
}

// Removes one task from a folder's plan array — used when a task-derived
// calendar event is deleted from the calendar page's detail panel.
export async function deleteTaskFromCalendar(
  clientId: string,
  taskId: string,
): Promise<void> {
  const tasks = await getPlanTasks(clientId);
  const updated = tasks.filter((t) => t.id !== taskId);
  await savePlanTasks(clientId, updated);
}
