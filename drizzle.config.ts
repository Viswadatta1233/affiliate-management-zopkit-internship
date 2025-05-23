import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'asdfvbnm1234',
    database: process.env.DB_NAME || 'affiliate_db',
    port: Number(process.env.DB_PORT) || 5432,
  },
} satisfies Config; 