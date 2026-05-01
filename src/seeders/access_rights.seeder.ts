import { db } from "../db";
import { accessRights } from "../db/schema";

const ACCESS_RIGHTS_DATA = [
  { name: "view_dashboard", description: "View admin dashboard" },
  { name: "manage_users", description: "Create, update and delete users" },
  { name: "view_users", description: "View users list" },
  { name: "manage_roles", description: "Create, update and delete roles" },
  { name: "view_roles", description: "View roles list" },
  { name: "manage_products", description: "Create, update and delete products" },
  { name: "view_products", description: "View products" },
  { name: "manage_categories", description: "Create, update and delete categories" },
  { name: "view_categories", description: "View categories" },
  { name: "manage_orders", description: "View and manage orders" },
  { name: "view_orders", description: "View orders" },
  { name: "manage_inventory", description: "Manage product inventory and stock" },
  { name: "view_reports", description: "View reports and analytics" },
  { name: "manage_settings", description: "Manage system settings" },
  { name: "manage_coupons", description: "Create, update and delete coupons" },
  { name: "manage_payments", description: "View and manage payments" },
];

export const seedAccessRights = async () => {
  console.log("Seeding access rights...");

  const result = await db
    .insert(accessRights)
    .values(ACCESS_RIGHTS_DATA)
    .onConflictDoNothing({ target: accessRights.name })
    .returning({ name: accessRights.name });

  const inserted = result.length;
  const skipped = ACCESS_RIGHTS_DATA.length - inserted;

  console.log(`Access rights: ${inserted} inserted, ${skipped} skipped (already exist)`);
};
