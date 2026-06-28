import { boolean, integer, jsonb, serial, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { timestamps } from "../utils";
import { folders } from "./folders";
import { nextJsAppSchema } from "./schema";

export const summaries = nextJsAppSchema.table("summaries", {
  id: serial().primaryKey(),
  folderId: integer().references(() => folders.id),
  graph: jsonb(),
  status: varchar({ length: 12 }),
  summaryResult: jsonb(),
  completion: boolean(),
  ...timestamps,
});

export const summariesRelations = relations(summaries, ({ one }) => ({
  folders: one(folders, {
    fields: [summaries.folderId],
    references: [folders.id],
  }),
}));
