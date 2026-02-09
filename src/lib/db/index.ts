import { prisma, basePrisma } from "./client"

/**
 * Default DB client alias for modules expecting "@/lib/db".
 *
 * Uses the extended Prisma client (RLS + audit logging).
 * Export basePrisma for low-level access when needed.
 */
export const db = prisma
export { prisma, basePrisma }
