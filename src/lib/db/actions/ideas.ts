"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { ensureUser, requireUserId } from "@/lib/db/auth";
import { db } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";
import type { CreativeScript, Platform, ScriptColor } from "@/types/creative";
import type { ScriptDraft } from "@/utils/creative";

const COLOR_CYCLE: ScriptColor[] = ["blue", "yellow", "pink"];

function toScript(row: typeof folders.$inferSelect): CreativeScript {
  return {
    id: row.clientId ?? String(row.id),
    title: row.name ?? "Untitled project",
    body: row.goal ?? "",
    folderId: "f-default",
    createdAt: row.createdAt.toISOString(),
    emoji: row.emoji ?? "✨",
    colorTag: (row.colorTag as ScriptColor) ?? undefined,
    goal: row.goal ?? undefined,
    platform: (row.platform as Platform) ?? undefined,
  };
}

export async function listIdeas(): Promise<CreativeScript[]> {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(folders.createdAt);
  return rows.map(toScript);
}

export async function getIdeaByClientId(
  clientId: string,
): Promise<CreativeScript | null> {
  const userId = await requireUserId();
  if (clientId === "default") return getOrCreateDefault(userId);
  const [row] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
  return row ? toScript(row) : null;
}

async function getOrCreateDefault(userId: string): Promise<CreativeScript> {
  const [existing] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, "default")));
  if (existing) return toScript(existing);
  await ensureUser(userId);
  const [created] = await db
    .insert(folders)
    .values({
      userId,
      clientId: "default",
      name: "Untitled project",
      emoji: "✨",
    })
    .onConflictDoNothing()
    .returning();
  // If another concurrent request won the race, fetch the winner.
  if (!created) {
    const [winner] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.clientId, "default")));
    return toScript(winner);
  }
  return toScript(created);
}

export async function createIdea(draft: ScriptDraft): Promise<CreativeScript> {
  const userId = await requireUserId();
  await ensureUser(userId);

  const name = draft.name.trim();
  const title = name.length > 0 ? name.slice(0, 48) : "Untitled project";
  const clientId = `s-${randomUUID()}`;

  // Cycle colours the same way the old localStorage version did.
  const [{ count }] = await db
    .select({ count: sql<string>`count(*)` })
    .from(folders)
    .where(eq(folders.userId, userId));
  const colorTag = COLOR_CYCLE[Number(count) % COLOR_CYCLE.length];

  const [row] = await db
    .insert(folders)
    .values({
      userId,
      clientId,
      name: title,
      emoji: "✨",
      colorTag,
      goal: draft.goal.trim() || undefined,
      platform: (draft.platform as Platform) || undefined,
    })
    .returning();

  return toScript(row);
}

export async function renameIdea(
  clientId: string,
  name: string,
): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(folders)
    .set({ name: name.slice(0, 48) || "Untitled project" })
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
}

export async function deleteIdea(clientId: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .delete(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
}
