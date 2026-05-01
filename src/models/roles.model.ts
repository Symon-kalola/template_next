import { eq } from "drizzle-orm";
import { db } from "../db";
import { roles, NewRole } from "../db/schema";
import { UpdateRoleInput } from "../validators/roles.validator";

export const RoleModel = {
  findAll: () => db.select().from(roles).orderBy(roles.createdAt),

  findById: (id: string) =>
    db.select().from(roles).where(eq(roles.id, id)).then((rows) => rows[0] ?? null),

  findByName: (name: string) =>
    db.select().from(roles).where(eq(roles.name, name)).then((rows) => rows[0] ?? null),

  create: (data: NewRole) =>
    db.insert(roles).values(data).returning().then((rows) => rows[0]),

  update: (id: string, data: UpdateRoleInput) =>
    db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning()
      .then((rows) => rows[0] ?? null),

  delete: (id: string) =>
    db.delete(roles).where(eq(roles.id, id)).returning().then((rows) => rows[0] ?? null),
};
