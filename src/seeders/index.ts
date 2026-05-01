import { pool } from "../db";
import { seedAccessRights } from "./access_rights.seeder";
import { seedAdmin } from "./admin.seeder";

const runSeeders = async () => {
  console.log("Running seeders...\n");
  try {
    await seedAccessRights();
    await seedAdmin();
    console.log("\nAll seeders completed.");
  } catch (err) {
    console.error("Seeder failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSeeders();
