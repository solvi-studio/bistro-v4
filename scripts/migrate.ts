import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../db/db';

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Specify the path to your generated migration folder
    await migrate(db, { migrationsFolder: './drizzle', migrationsSchema: 'nextjs_app_schema', migrationsTable: 'migrations' });
    console.log('Migrations complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();