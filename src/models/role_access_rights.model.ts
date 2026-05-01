import { eq } from "drizzle-orm";
import { db } from "../db";
import { roleAccessRights, accessRights } from "../db/schema";

export const RoleAccessRightModel = {
  findByRoleId: (roleId: string) =>
    db
      .select({ accessRight: accessRights })
      .from(roleAccessRights)
      .innerJoin(accessRights, eq(accessRights.id, roleAccessRights.accessRightId))
      .where(eq(roleAccessRights.roleId, roleId))
      .then((rows) => rows.map((r) => r.accessRight)),

  replaceForRole: (roleId: string, accessRightIds: number[]) =>
    db.transaction(async (tx) => {
      await tx.delete(roleAccessRights).where(eq(roleAccessRights.roleId, roleId));
      if (accessRightIds.length === 0) return [];
      return tx
        .insert(roleAccessRights)
        .values(accessRightIds.map((id) => ({ roleId, accessRightId: id })))
        .returning();
    }),
};
