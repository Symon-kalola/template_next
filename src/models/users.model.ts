import { and, eq, ilike, or, count, desc } from "drizzle-orm";
import { db } from "../db";
import { users, roles, NewUser, UserStatus } from "../db/schema";

interface UserFilters {
  page: number;
  limit: number;
  status?: UserStatus;
  roleId?: string;
  search?: string;
}

const sanitize = (user: typeof users.$inferSelect) => {
  const { passwordHash, otpHash, otpExpiresAt, ...safe } = user;
  return safe;
};

export const UserModel = {
  findById: (id: number) =>
    db.select().from(users).where(eq(users.id, id)).then((r) => r[0] ?? null),

  findSafeById: (id: number) =>
    db.select().from(users).where(eq(users.id, id)).then((r) => (r[0] ? sanitize(r[0]) : null)),

  findByIdWithRole: (id: number) =>
    db
      .select({
        id: users.id,
        serviceNumber: users.serviceNumber,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        rank: users.rank,
        unit: users.unit,
        status: users.status,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: { id: roles.id, name: roles.name, description: roles.description },
      })
      .from(users)
      .leftJoin(roles, eq(roles.id, users.roleId))
      .where(eq(users.id, id))
      .then((r) => r[0] ?? null),

  findByServiceNumber: (serviceNumber: string) =>
    db.select().from(users).where(eq(users.serviceNumber, serviceNumber)).then((r) => r[0] ?? null),

  findByEmail: (email: string) =>
    db.select().from(users).where(eq(users.email, email)).then((r) => r[0] ?? null),

  findAll: async ({ page, limit, status, roleId, search }: UserFilters) => {
    const where = and(
      status ? eq(users.status, status) : undefined,
      roleId ? eq(users.roleId, roleId) : undefined,
      search
        ? or(
            ilike(users.serviceNumber, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
          )
        : undefined,
    );

    const offset = (page - 1) * limit;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          serviceNumber: users.serviceNumber,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          rank: users.rank,
          unit: users.unit,
          status: users.status,
          roleId: users.roleId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          role: { id: roles.id, name: roles.name },
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ]);

    const total = countResult[0]?.total ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  create: (data: NewUser) =>
    db.insert(users).values(data).returning().then((r) => sanitize(r[0])),

  updateById: (id: number, data: Partial<Omit<typeof users.$inferInsert, "id" | "serviceNumber">>) =>
    db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
      .then((r) => (r[0] ? sanitize(r[0]) : null)),

  updateStatus: (id: number, status: UserStatus) =>
    db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
      .then((r) => (r[0] ? sanitize(r[0]) : null)),

  register: (id: number, email: string, passwordHash: string) =>
    db
      .update(users)
      .set({ email, passwordHash, status: "active", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
      .then((r) => sanitize(r[0])),

  setOtp: (id: number, otpHash: string, otpExpiresAt: Date) =>
    db.update(users).set({ otpHash, otpExpiresAt, updatedAt: new Date() }).where(eq(users.id, id)),

  updatePassword: (id: number, passwordHash: string) =>
    db
      .update(users)
      .set({ passwordHash, otpHash: null, otpExpiresAt: null, updatedAt: new Date() })
      .where(eq(users.id, id)),

  sanitize,
};
