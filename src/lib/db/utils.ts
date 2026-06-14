import { pgSchema, timestamp } from "drizzle-orm/pg-core";

// Schema
export const bistroFeSchema = pgSchema("bistro_fe");

export const timestamps = {
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
};