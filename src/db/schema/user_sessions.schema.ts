import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "deactivated",
  "logged_out",
  "expired",
]);

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceInfo: text("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  expiresAt: timestamp("expires_at").notNull(),
  refreshToken: varchar("refresh_token", { length: 255 }).notNull().unique(),
  location: varchar("location", { length: 255 }),
  status: sessionStatusEnum("status").notNull().default("active"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type SessionStatus = (typeof sessionStatusEnum.enumValues)[number];
