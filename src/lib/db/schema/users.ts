import { text, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../utils";
import { relations } from "drizzle-orm/relations";
import { folders } from "./folders";
import { bistroFeSchema } from "./schema";

export const users = bistroFeSchema.table('users', {
  id: text().primaryKey(),
  name: varchar({ length: 255 }),
  ...timestamps
});

export const usersRelations = relations(users, ({many}) => ({
  folders: many(folders),
}));