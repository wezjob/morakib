import { Prisma, PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const enableQueryLogs = process.env.PRISMA_DEBUG_QUERIES === "true";
  const devLogs: Prisma.LogLevel[] = enableQueryLogs
    ? ["query", "error", "warn"]
    : ["error", "warn"];
  const prodLogs: Prisma.LogLevel[] = ["error"];

  // In production or when DATABASE_URL is set, use pg adapter
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    
    const pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || "5432"),
      database: url.pathname.slice(1).split("?")[0],
      user: url.username,
      password: url.password,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? devLogs : prodLogs,
    });
  }
  
  // Fallback for build time (no DB connection needed)
  return new PrismaClient({
    log: prodLogs,
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
export const prisma = db; // Alias for compatibility

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
