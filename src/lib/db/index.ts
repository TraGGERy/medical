import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Only load .env.local if we are running CLI scripts and the file exists
if (!process.env.NEXT_RUNTIME) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export type Database = typeof db;