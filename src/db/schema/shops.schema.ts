import { pgTable, serial, varchar, text, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const shopStatusEnum = pgEnum("shop_status", ["active", "inactive", "suspended"]);

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  unit: varchar("unit", { length: 100 }),
  geoLat: doublePrecision("geo_lat"),
  geoLong: doublePrecision("geo_long"),
  status: shopStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ShopStatus = (typeof shopStatusEnum.enumValues)[number];
