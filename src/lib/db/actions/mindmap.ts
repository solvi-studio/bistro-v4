"use server";

import "server-only";
import type { Edge, Node, Viewport } from "@xyflow/react";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/db/auth";
import { db } from "@/lib/db/index";
import { folders } from "@/lib/db/schema/folders";

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

export async function loadCanvas(
  clientId: string,
): Promise<CanvasState | null> {
  const userId = await requireUserId();
  const [row] = await db
    .select({ canvas: folders.canvas })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
  return (row?.canvas as CanvasState | null) ?? null;
}

export async function saveCanvas(
  clientId: string,
  state: CanvasState,
): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(folders)
    .set({ canvas: state as unknown as Record<string, unknown> })
    .where(and(eq(folders.userId, userId), eq(folders.clientId, clientId)));
}
