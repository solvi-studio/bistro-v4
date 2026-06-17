import { integer, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { timestamps } from "../utils";
import { folders } from "./folders";
import { nextJsAppSchema } from "./schema";

export const phaseEnum = nextJsAppSchema.enum('phase', ['pre-production', 'production', 'post-production']);

export const tasks = nextJsAppSchema.table('tasks', {
  id: serial().primaryKey(),
  folderId: integer().references(() => folders.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }),
  phase: phaseEnum(),
  date: timestamp(),
  ...timestamps
});

export const tasksRelations = relations(tasks, ({one}) => ({
  folders: one(folders, {
    fields: [tasks.folderId],
    references: [folders.id]
  }),
}));