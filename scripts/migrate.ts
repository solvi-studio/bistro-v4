import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  console.log("Running migrations...");
  try {
    await migrate(db, {
      migrationsFolder: "./drizzle",
      migrationsSchema: "nextjs_app_schema",
      migrationsTable: "migrations",
    });
    console.log("Migrations complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigrations();
