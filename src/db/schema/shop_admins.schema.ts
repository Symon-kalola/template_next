import { pgTable, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { shops } from "./shops.schema";
import { users } from "./users.schema";

export const shopAdmins = pgTable(
  "shop_admins",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPrimaryAdmin: boolean("is_primary_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueShopAdmin: unique("uq_shop_admin").on(table.shopId, table.userId),
  }),
);

export type ShopAdmin = typeof shopAdmins.$inferSelect;
export type NewShopAdmin = typeof shopAdmins.$inferInsert;
