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

// Export basePrisma for use in audit logging (prevents recursion)
export { basePrisma }

/**
 * Extended Prisma Client with Row-Level Security (RLS) context and Audit Logging
 *
 * Features:
 * 1. RLS Context: Automatically sets PostgreSQL session variable 'app.current_tenant_id'
 *    before each database operation, enabling RLS policies to filter data by tenant.
 *
 * 2. Audit Logging: Automatically logs all create/update/delete operations to AuditLog table
 *    for HIPAA compliance. Captures user context from request headers.
 *
 * Usage:
 * - In API routes: const data = await prisma.organization.findMany()
 * - In server components: const data = await prisma.organization.findMany()
 *
 * The middleware injects x-tenant-id and x-user-id headers which this extension reads.
 */
export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      // Extract context from request headers (injected by middleware)
      const headersList = await headers()
      const tenantId = headersList.get("x-tenant-id")
      const userId = headersList.get("x-user-id")

      // If tenant ID present, set PostgreSQL session variable for RLS
      if (tenantId) {
        // Execute SET command to configure session variable
        // Using false = session-scoped (persists until connection released to pool)
        // This ensures RLS policies using current_setting('app.current_tenant_id')
        // will filter data to only the current tenant
        // Using parameterized query to prevent SQL injection
        await basePrisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, false)`
      }

      // Execute the actual query with RLS context active
      const result = await query(args)

      // Audit logging for mutations (create, update, delete)
      // Skip if:
      // - Model is AuditLog itself (prevent recursion)
      // - Operation is not a mutation (read operations don't need audit)
      // - No tenant context (can't log without organization)
      const isMutation = ["create", "update", "delete", "createMany", "updateMany", "deleteMany"].includes(operation)
      const shouldAudit = model !== "AuditLog" && isMutation && tenantId

      if (shouldAudit) {
        try {
          // Determine resource ID from operation
          let resourceId: string | null = null
          if (operation === "create" && result && typeof result === "object" && "id" in result) {
            resourceId = result.id as string
          } else if (operation === "update" || operation === "delete") {
            resourceId = args.where?.id as string | undefined || null
          }

          // Map operation to action
          const action = operation.replace("Many", "") // "createMany" -> "create"

          // Capture changes for update operations
          let changes: Record<string, any> | undefined
          if (operation === "update" || operation === "updateMany") {
            changes = {
              data: args.data,
            }
          } else if (operation === "create") {
            changes = {
              data: args.data || args,
            }
          }

          // Log audit event using basePrisma (prevents recursion)
          await basePrisma.auditLog.create({
            data: {
              organizationId: tenantId,
              userId: userId || undefined,
              action,
              resource: model || "unknown",
              resourceId: resourceId || undefined,
              changes: changes || undefined,
              metadata: {
                operation,
                timestamp: new Date().toISOString(),
              },
            },
          })
        } catch (error) {
          // Non-blocking error handling - log error but don't fail the operation
          console.error("Audit logging failed:", error)
        }
      }

      return result
    },
  },
})
