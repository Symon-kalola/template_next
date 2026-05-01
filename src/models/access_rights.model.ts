import { eq } from "drizzle-orm";
import { db } from "../db";
import { accessRights } from "../db/schema";

export const AccessRightModel = {
  findAll: () => db.select().from(accessRights).orderBy(accessRights.name),

  findById: (id: number) =>
    db
      .select()
      .from(accessRights)
      .where(eq(accessRights.id, id))
      .then((rows) => rows[0] ?? null),

  existsByIds: async (ids: number[]): Promise<boolean> => {
    const rows = await db
      .select({ id: accessRights.id })
      .from(accessRights)
      .then((all) => all.map((r) => r.id));
    return ids.every((id) => rows.includes(id));
  },
};
