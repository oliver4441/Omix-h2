import { PrismaClient } from "@prisma/client";

// ─── Primary Database Client (Supabase PostgreSQL) ───
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Secondary Database Client (SQLite Local) ───
// Lazily loaded to avoid pulling WASM engine into Edge Runtime (middleware)
type LocalPrismaClient = import("@/generated/local-client").PrismaClient;

const globalForLocal = globalThis as unknown as {
  localDb: LocalPrismaClient | undefined;
};

export function getLocalDb(): LocalPrismaClient {
  if (globalForLocal.localDb) return globalForLocal.localDb;

  // Dynamic require — only evaluated when called, not at module load time
  // This prevents Edge Runtime (middleware) from hitting setImmediate errors
  const { PrismaClient: LocalClient } = require("@/generated/local-client");
  const db = new LocalClient();
  if (process.env.NODE_ENV !== "production") globalForLocal.localDb = db;
  return db;
}
