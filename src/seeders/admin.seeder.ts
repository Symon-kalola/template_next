import { eq } from "drizzle-orm";
import { db } from "../db";
import { roles, users } from "../db/schema";
import { hashPassword } from "../utils/hash";

const ADMIN_ROLE = {
  name: "admin",
  description: "Full system access",
};

const ADMIN_USER = {
  serviceNumber: "ADMIN-001",
  email: "admin@kdfeshop.com",
  firstName: "System",
  lastName: "Admin",
  status: "active" as const,
  password: "Admin@1234",
};

export const seedAdmin = async () => {
  console.log("Seeding admin role and user...");

  // Find or create admin role
  let role = await db
    .select()
    .from(roles)
    .where(eq(roles.name, ADMIN_ROLE.name))
    .then((r) => r[0] ?? null);

  if (!role) {
    role = await db.insert(roles).values(ADMIN_ROLE).returning().then((r) => r[0]);
    console.log(`  Role "${ADMIN_ROLE.name}" created (id: ${role.id})`);
  } else {
    console.log(`  Role "${ADMIN_ROLE.name}" already exists — skipped`);
  }

  // Find or create admin user
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.serviceNumber, ADMIN_USER.serviceNumber))
    .then((r) => r[0] ?? null);

  if (!existing) {
    const passwordHash = await hashPassword(ADMIN_USER.password);
    await db.insert(users).values({
      serviceNumber: ADMIN_USER.serviceNumber,
      email: ADMIN_USER.email,
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      status: ADMIN_USER.status,
      roleId: role.id,
      passwordHash,
    });
    console.log(`  Admin user created (service_number: ${ADMIN_USER.serviceNumber})`);
    console.log(`  Default password: ${ADMIN_USER.password}  ← change this after first login`);
  } else {
    console.log(`  Admin user already exists — skipped`);
  }
};
