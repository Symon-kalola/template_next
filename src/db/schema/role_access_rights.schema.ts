import { pgTable, serial, uuid, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { roles } from "./roles.schema";
import { accessRights } from "./access_rights.schema";

export const roleAccessRights = pgTable(
  "role_access_rights",
  {
    id: serial("id").primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    accessRightId: integer("access_right_id")
      .notNull()
      .references(() => accessRights.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueRoleAccessRight: unique("uq_role_access_right").on(table.roleId, table.accessRightId),
  }),
);

export type RoleAccessRight = typeof roleAccessRights.$inferSelect;
export type NewRoleAccessRight = typeof roleAccessRights.$inferInsert;
