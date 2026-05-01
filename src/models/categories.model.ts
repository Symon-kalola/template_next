import { and, eq, ilike, count, asc, isNull } from "drizzle-orm";
import { db } from "../db";
import { categories, NewCategory, CategoryStatus } from "../db/schema";

interface CategoryFilters {
  page: number;
  limit: number;
  status?: CategoryStatus;
  parent_id?: number;
  search?: string;
}

export const CategoryModel = {
  findAll: async ({ page, limit, status, parent_id, search }: CategoryFilters) => {
    const where = and(
      status ? eq(categories.status, status) : undefined,
      parent_id !== undefined ? eq(categories.parentId, parent_id) : undefined,
      search ? ilike(categories.name, `%${search}%`) : undefined,
    );

    const offset = (page - 1) * limit;

    const [items, countResult] = await Promise.all([
      db.select().from(categories).where(where).orderBy(asc(categories.displayOrder), asc(categories.name)).limit(limit).offset(offset),
      db.select({ total: count() }).from(categories).where(where),
    ]);

    const total = countResult[0]?.total ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  findRoots: () =>
    db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.displayOrder), asc(categories.name)),

  findById: (id: number) =>
    db.select().from(categories).where(eq(categories.id, id)).then((r) => r[0] ?? null),

  findChildren: (parentId: number) =>
    db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.displayOrder), asc(categories.name)),

  create: (data: NewCategory) =>
    db.insert(categories).values(data).returning().then((r) => r[0]),

  update: (id: number, data: Partial<NewCategory>) =>
    db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  updateStatus: (id: number, status: CategoryStatus) =>
    db
      .update(categories)
      .set({ status, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  delete: (id: number) =>
    db.delete(categories).where(eq(categories.id, id)).returning().then((r) => r[0] ?? null),
};
