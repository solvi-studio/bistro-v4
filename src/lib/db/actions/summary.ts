"use server";

import "server-only";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/db/auth";
import { getDb } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";
import { summaries } from "@/lib/db/schema/summaries";
import type { SummariseResult } from "@/types/summarise";
import type { MindMapGraph } from "@/utils/mindmap-export";

async function resolveFolderId(
  userId: string,
  clientId: string,
): Promise<string | null> {
  const [folder] = await getDb()
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
  return folder?.id ?? null;
}

async function getSummaryRow(folderId: string) {
  const [row] = await getDb()
    .select()
    .from(summaries)
    .where(eq(summaries.folderId, folderId));
  return row ?? null;
}

type SummaryData = Partial<typeof summaries.$inferInsert>;

async function upsertSummary(folderId: string, data: SummaryData) {
  const existing = await getSummaryRow(folderId);
  if (existing) {
    await getDb().update(summaries).set(data).where(eq(summaries.id, existing.id));
  } else {
    await getDb().insert(summaries).values({ folderId, ...data });
  }
}

export async function dbGetSummaryStatus(
  clientId: string,
): Promise<"pending" | "done" | "error" | null> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return null;
  const row = await getSummaryRow(folderId);
  return (row?.status as "pending" | "done" | "error" | null) ?? null;
}

export async function dbSaveGraph(
  clientId: string,
  graph: MindMapGraph,
): Promise<void> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return;
  await upsertSummary(folderId, {
    graph: graph as unknown as Record<string, unknown>,
    status: "pending",
    summaryResult: null,
    completion: false,
  });
}

export async function dbSaveResult(
  clientId: string,
  result: SummariseResult,
): Promise<void> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return;
  await upsertSummary(folderId, {
    summaryResult: result as unknown as Record<string, unknown>,
    status: "done",
    completion: true,
  });
}

export async function dbSetError(clientId: string): Promise<void> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return;
  await upsertSummary(folderId, { status: "error" });
}

export async function dbGetResult(
  clientId: string,
): Promise<SummariseResult | null> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return null;
  const row = await getSummaryRow(folderId);
  return (row?.summaryResult as SummariseResult | null) ?? null;
}

export async function dbGetGraph(
  clientId: string,
): Promise<MindMapGraph | null> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return null;
  const row = await getSummaryRow(folderId);
  return (row?.graph as MindMapGraph | null) ?? null;
}

export async function dbClearSummary(clientId: string): Promise<void> {
  const userId = await requireUserId();
  const folderId = await resolveFolderId(userId, clientId);
  if (!folderId) return;
  await getDb().delete(summaries).where(eq(summaries.folderId, folderId));
}
