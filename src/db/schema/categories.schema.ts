import { pgTable, serial, varchar, text, integer, timestamp, pgEnum, AnyPgColumn } from "drizzle-orm/pg-core";

export const categoryStatusEnum = pgEnum("category_status", ["active", "inactive"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
  status: categoryStatusEnum("status").notNull().default("active"),
  iconUrl: varchar("icon_url", { length: 500 }),
  bannerUrl: varchar("banner_url", { length: 500 }),
  displayOrder: integer("display_order").notNull().default(0),
  returnWindowDays: integer("return_window_days"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryStatus = (typeof categoryStatusEnum.enumValues)[number];
