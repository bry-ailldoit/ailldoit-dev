import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let connection_pool: Pool | null = null;
let connection_db: ReturnType<typeof drizzle> | null = null;

/**
 * Returns a lazily-initialized Pool and Drizzle instance.
 * Ensures DATABASE_URL exists and avoids pg-connection-string parsing issues.
 */
export function getDB() {
  if (!connection_pool || !connection_db) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      console.error('❌ DATABASE: DATABASE_URL missing or empty!');
      console.log('🔍 DATABASE: Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
      throw new Error('DATABASE_URL must be set for production');
    }

    console.log('🔗 DATABASE: Creating connection pool...');
    connection_pool = new Pool({
      connectionString: url,
      ssl: false, // Cloud Run + Cloud SQL Unix socket does not require SSL
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('🗄️ DATABASE: Creating Drizzle instance...');
    connection_db = drizzle({ client: connection_pool, schema });

    console.log('✅ DATABASE: Pool and Drizzle instance created');

    // Optional: test connection
    connection_pool.query('SELECT 1')
      .then(() => console.log('🧪 DATABASE: Connection test successful'))
      .catch((err) => console.error('❌ DATABASE: Connection test failed:', err.message));
  }

  return { connection_pool, connection_db };
}

export function pool() {
  return getDB().connection_pool;
}

export function db() {
  return getDB().connection_db;
}