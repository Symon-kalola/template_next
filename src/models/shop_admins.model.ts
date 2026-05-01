import { and, eq, inArray, desc } from "drizzle-orm";
import { db } from "../db";
import { shopAdmins, users } from "../db/schema";

export const ShopAdminModel = {
  findByShopId: (shopId: number) =>
    db
      .select({
        id: shopAdmins.id,
        shopId: shopAdmins.shopId,
        userId: shopAdmins.userId,
        isPrimaryAdmin: shopAdmins.isPrimaryAdmin,
        createdAt: shopAdmins.createdAt,
        user: {
          id: users.id,
          serviceNumber: users.serviceNumber,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          rank: users.rank,
          unit: users.unit,
        },
      })
      .from(shopAdmins)
      .leftJoin(users, eq(users.id, shopAdmins.userId))
      .where(eq(shopAdmins.shopId, shopId))
      .orderBy(desc(shopAdmins.isPrimaryAdmin), shopAdmins.createdAt),

  addAdmins: (shopId: number, admins: { userId: number; isPrimaryAdmin: boolean }[]) =>
    db
      .insert(shopAdmins)
      .values(admins.map((a) => ({ shopId, userId: a.userId, isPrimaryAdmin: a.isPrimaryAdmin })))
      .onConflictDoNothing()
      .returning(),

  removeAdmins: (shopId: number, userIds: number[]) =>
    db
      .delete(shopAdmins)
      .where(and(eq(shopAdmins.shopId, shopId), inArray(shopAdmins.userId, userIds)))
      .returning(),
};
