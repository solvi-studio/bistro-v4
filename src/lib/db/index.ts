import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { folders } from "./schema/folders";
import { summaries } from "./schema/summaries";
import { tasks } from "./schema/tasks";
import { users } from "./schema/users";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = { folders, summaries, tasks, users };

export const db = drizzle(pool, { schema, casing: "snake_case" });
