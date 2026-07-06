"use server";

import "server-only";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/db/auth";
import { getDb } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";
import type { PlanTask } from "@/types/plan";

export async function getPlanTasks(clientId: string): Promise<PlanTask[]> {
  const userId = await requireUserId();
  const [row] = await getDb()
    .select({ plan: folders.plan })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
  return (row?.plan as PlanTask[] | null) ?? [];
}

export async function savePlanTasks(
  clientId: string,
  tasks: PlanTask[],
): Promise<void> {
  const userId = await requireUserId();
  await getDb()
    .update(folders)
    .set({ plan: tasks as unknown as Record<string, unknown> })
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
}
