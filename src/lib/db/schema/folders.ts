import { jsonb, serial, text, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { timestamps } from "../utils";
import { nextJsAppSchema } from "./schema";
import { summaries } from "./summaries";
import { tasks } from "./tasks";
import { users } from "./users";

export const folders = nextJsAppSchema.table('folders', {
  id: serial().primaryKey(),
  userId: text().references(() => users.id),
  name: varchar({ length: 255 }),
  emoji: varchar({ length: 8 }),
  bigPicture: jsonb(),
  composition: jsonb(),
  toneMood: jsonb(),
  targetAudience: jsonb(),
  ...timestamps
});

export const foldersRelations = relations(folders, ({one, many}) => ({
  users: one(users, {
    fields: [folders.userId],
    references: [users.id]
  }),
  summaries: many(summaries),
  tasks: many(tasks),
}));