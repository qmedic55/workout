import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Don't throw at module load time - let it fail when actually used
// This allows the health check endpoint to respond before DB is ready
const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : null as unknown as pg.Pool;

export const db = connectionString
  ? drizzle(pool, { schema })
  : null as unknown as ReturnType<typeof drizzle<typeof schema>>;

// Helper to check if DB is available
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

// Throw helpful error if DB is used without being configured
export function ensureDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}
