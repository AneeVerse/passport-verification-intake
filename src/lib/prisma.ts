import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function getPool(): pg.Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const rawConnectionString = process.env.DATABASE_URL || "";
  const connectionString = rawConnectionString.replace("sslmode=require", "");

  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    // Serverless-friendly settings
    max: 3,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  // Handle pool errors to prevent unhandled rejections that crash serverless
  pool.on("error", (err) => {
    console.error("Prisma pg pool error:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return pool;
}

function createPrismaClient(): PrismaClient {
  const pool = getPool();
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
