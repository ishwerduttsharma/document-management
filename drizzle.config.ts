import { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
export default {
  schema: './src/database/schema.ts', // Path to schema
  out: './src/database/migrations', // Output folder for migrations
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
} satisfies Config;
