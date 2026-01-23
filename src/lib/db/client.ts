import { PrismaClient } from "../../../generated/prisma/client"
import { headers } from "next/headers"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Base Prisma Client (without RLS context)
const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma

/**
 * Extended Prisma Client with Row-Level Security (RLS) context
 *
 * Automatically sets PostgreSQL session variable 'app.current_tenant_id'
 * before each database operation, enabling RLS policies to filter data
 * by the current tenant.
 *
 * Usage:
 * - In API routes: const data = await prisma.organization.findMany()
 * - In server components: const data = await prisma.organization.findMany()
 *
 * The middleware injects x-tenant-id header which this extension reads.
 */
export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      // Extract tenant ID from request headers (injected by middleware)
      const headersList = await headers()
      const tenantId = headersList.get("x-tenant-id")

      // If tenant ID present, set PostgreSQL session variable for RLS
      if (tenantId) {
        // Execute SET command to configure session variable
        // Using false = session-scoped (persists until connection released to pool)
        // This ensures RLS policies using current_setting('app.current_tenant_id')
        // will filter data to only the current tenant
        await basePrisma.$executeRawUnsafe(
          `SELECT set_config('app.current_tenant_id', '${tenantId}', false)`
        )
      }

      // Execute the actual query with RLS context active
      return query(args)
    },
  },
})
