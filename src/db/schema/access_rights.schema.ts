import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const accessRights = pgTable("access_rights", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AccessRight = typeof accessRights.$inferSelect;
export type NewAccessRight = typeof accessRights.$inferInsert;
