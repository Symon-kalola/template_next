import { and, eq, ilike, or, count, desc } from "drizzle-orm";
import { db } from "../db";
import { shops, NewShop, ShopStatus } from "../db/schema";

interface ShopFilters {
  page: number;
  limit: number;
  status?: ShopStatus;
  search?: string;
}

export const ShopModel = {
  findAll: async ({ page, limit, status, search }: ShopFilters) => {
    const where = and(
      status ? eq(shops.status, status) : undefined,
      search ? or(ilike(shops.name, `%${search}%`), ilike(shops.unit, `%${search}%`)) : undefined,
    );

    const offset = (page - 1) * limit;

    const [items, countResult] = await Promise.all([
      db.select().from(shops).where(where).orderBy(desc(shops.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(shops).where(where),
    ]);

    const total = countResult[0]?.total ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findById: (id: number) =>
    db.select().from(shops).where(eq(shops.id, id)).then((r) => r[0] ?? null),

  create: (data: NewShop) =>
    db.insert(shops).values(data).returning().then((r) => r[0]),

  update: (id: number, data: Partial<NewShop>) =>
    db
      .update(shops)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shops.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  updateStatus: (id: number, status: ShopStatus) =>
    db
      .update(shops)
      .set({ status, updatedAt: new Date() })
      .where(eq(shops.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  delete: (id: number) =>
    db.delete(shops).where(eq(shops.id, id)).returning().then((r) => r[0] ?? null),
};
