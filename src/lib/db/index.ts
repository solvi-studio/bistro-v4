import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { folders } from "./schema/folders";
import { summaries } from "./schema/summaries";
import { tasks } from "./schema/tasks";
import { users } from "./schema/users";

const schema = { folders, summaries, tasks, users };

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const connectionString = (env as any).HYPERDRIVE.connectionString ?? process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema, casing: "snake_case" });
});
