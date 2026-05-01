import { pgTable, serial, varchar, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles.schema";

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "active",
  "deactivated",
  "suspended",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  status: userStatusEnum("status").notNull().default("pending"),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  serviceNumber: varchar("service_number", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  rank: varchar("rank", { length: 100 }),
  unit: varchar("unit", { length: 100 }),
  otpHash: varchar("otp_hash", { length: 255 }),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
