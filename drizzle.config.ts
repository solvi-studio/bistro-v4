import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the .env file');
}

export default defineConfig({
  schema: './src/lib/db/schema', // Your schema file path
  out: './drizzle', // Your migrations folder
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: 'snake_case',
  schemaFilter: ['nextjs_app_schema'],
  strict: true,
  verbose: true,
  migrations: {
    table: 'migrations', // `__drizzle_migrations` by default
    schema: 'nextjs_app_schema', // used in PostgreSQL only, `drizzle` by default
  },
});