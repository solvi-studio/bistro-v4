import { text, varchar } from "drizzle-orm/pg-core";
import { bistroFeSchema, timestamps } from "../utils";
import { relations } from "drizzle-orm/relations";
import { folders } from "./folders";

export const users = bistroFeSchema.table('users', {
  id: text().primaryKey(),
  name: varchar({ length: 255 }),
  ...timestamps
});

export const usersRelations = relations(users, ({many}) => ({
  folders: many(folders),
}));