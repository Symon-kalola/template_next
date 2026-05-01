import { and, eq, gte, lte, count, desc } from "drizzle-orm";
import { db } from "../db";
import { userSessions, users, NewUserSession, SessionStatus } from "../db/schema";

interface SessionFilters {
  page: number;
  limit: number;
  userId?: number;
  status?: SessionStatus;
  startDate?: string;
  endDate?: string;
}

export const UserSessionModel = {
  create: (data: NewUserSession) =>
    db.insert(userSessions).values(data).returning().then((r) => r[0]),

  findById: (id: number) =>
    db.select().from(userSessions).where(eq(userSessions.id, id)).then((r) => r[0] ?? null),

  findByRefreshToken: (token: string) =>
    db
      .select()
      .from(userSessions)
      .where(eq(userSessions.refreshToken, token))
      .then((r) => r[0] ?? null),

  updateStatus: (id: number, status: SessionStatus) =>
    db
      .update(userSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(userSessions.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  updateRefreshToken: (id: number, refreshToken: string, expiresAt: Date) =>
    db
      .update(userSessions)
      .set({ refreshToken, expiresAt, updatedAt: new Date() })
      .where(eq(userSessions.id, id)),

  logoutAllActive: (userId: number) =>
    db
      .update(userSessions)
      .set({ status: "logged_out", updatedAt: new Date() })
      .where(and(eq(userSessions.userId, userId), eq(userSessions.status, "active"))),

  findAll: async ({ page, limit, userId, status, startDate, endDate }: SessionFilters) => {
    const where = and(
      userId ? eq(userSessions.userId, userId) : undefined,
      status ? eq(userSessions.status, status) : undefined,
      startDate ? gte(userSessions.createdAt, new Date(startDate)) : undefined,
      endDate ? lte(userSessions.createdAt, new Date(endDate)) : undefined,
    );

    const offset = (page - 1) * limit;

    const [items, countResult] = await Promise.all([
      db
        .select({
          session: userSessions,
          user: {
            id: users.id,
            serviceNumber: users.serviceNumber,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(userSessions)
        .leftJoin(users, eq(users.id, userSessions.userId))
        .where(where)
        .orderBy(desc(userSessions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(userSessions).where(where),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      items: items.map(({ session, user }) => ({ ...session, user })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
