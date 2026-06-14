import { boolean, integer, jsonb, serial } from "drizzle-orm/pg-core";
import { bistroFeSchema, timestamps } from "../utils";
import { folders } from "./folders";
import { relations } from "drizzle-orm/relations";

export const summaries = bistroFeSchema.table('summaries', {
  id: serial().primaryKey(),
  folderId: integer().references(() => folders.id),
  summaryResult: jsonb(),
  completion: boolean(),
  ...timestamps
});

export const summariesRelations = relations(summaries, ({one}) => ({
  folders: one(folders, {
    fields: [summaries.folderId],
    references: [folders.id]
  }),
}));