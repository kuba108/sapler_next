import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'production' ? 5 : 1,
    // Neon keeps the compute awake while a connection stays open, so idle sockets have to close.
    idleTimeoutMillis: 5_000,
    maxLifetimeSeconds: 60 * 10,
  });
  // Fluid Compute suspends idle instances, which would freeze the idle timer above and leave
  // sockets open; this keeps the instance alive until the pool has released them.
  attachDatabasePool(pool);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma maps `bigint` columns to JS BigInt. This helper serializes any value
 * (including BigInt) so it can safely cross the server/client boundary or be
 * JSON-encoded, converting BigInt -> string.
 */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}
