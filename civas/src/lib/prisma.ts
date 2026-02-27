import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma v7+ "client" engine requires a driver adapter.
 * 
 * Key fixes:
 * 1. Use DIRECT_DATABASE_URL (port 5432) not PGBouncer (port 6543) to avoid
 *    "column (not available) does not exist" errors in transaction mode.
 * 2. Strip `sslmode` from the connection string so pg's ssl object takes full
 *    control — necessary to handle Supabase's self-signed certificate chain.
 */
function buildCleanUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.searchParams.delete("sslmode");
  return url.toString();
}

const rawUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("Neither DIRECT_DATABASE_URL nor DATABASE_URL is defined");
}

const directUrl = buildCleanUrl(rawUrl);
const isLocalhost =
  rawUrl.includes("127.0.0.1") || rawUrl.includes("localhost");

const pool = new Pool({
  connectionString: directUrl,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 5,
});

const adapter = new PrismaPg(pool, { schema: "public" });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClient = (globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
  })) as any;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;
