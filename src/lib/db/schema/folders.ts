import { jsonb, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { timestamps } from "../utils";
import { nextJsAppSchema } from "./schema";
import { summaries } from "./summaries";
import { tasks } from "./tasks";
import { users } from "./users";

export const folders = nextJsAppSchema.table(
  "folders",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text().references(() => users.id),
    clientId: text(),
    name: varchar({ length: 255 }),
    emoji: varchar({ length: 8 }),
    goal: text(),
    platform: varchar({ length: 16 }),
    colorTag: varchar({ length: 8 }),
    canvas: jsonb(),
    plan: jsonb(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("folders_user_client_idx").on(table.userId, table.clientId),
  ],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  users: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  summaries: many(summaries),
  tasks: many(tasks),
}));
