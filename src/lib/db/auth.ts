import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "./index";
import { users } from "./schema/users";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function ensureUser(userId: string): Promise<void> {
  await getDb().insert(users).values({ id: userId }).onConflictDoNothing();
}
