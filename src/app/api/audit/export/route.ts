import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { auth } from "@/auth"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * CSV Export Endpoint for Audit Logs
 *
 * GET /api/audit/export
 *
 * Exports audit logs as CSV file for compliance reporting.
 * Requires ADMIN role.
 *
 * Query parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - resource: Filter by resource type (optional)
 * - action: Filter by action type (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get tenant context from headers (injected by middleware)
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 })
    }

    // Check if user is ADMIN
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: tenantId,
        role: "ADMIN",
      },
    })

    if (!userOrg) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const resource = searchParams.get("resource")
    const action = searchParams.get("action")
    const resourceId = searchParams.get("resourceId")

    // Build filter
    const where: {
      organizationId: string
      createdAt?: { gte?: Date; lte?: Date }
      resource?: string
      resourceId?: string
      action?: string
    } = {
      organizationId: tenantId,
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (resource) {
      where.resource = resource
    }

    if (resourceId) {
      where.resourceId = resourceId
    }

    if (action) {
      where.action = action
    }

    // Fetch audit logs
    const logs: AuditLogWithUser[] = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Generate CSV
    const csv = generateCSV(logs)

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    logger.error("Audit export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

/**
 * Generate CSV from audit logs with proper escaping
 */
type AuditLogWithUser = {
  createdAt: Date
  user?: { email: string | null; name: string | null } | null
  action: string
  resource: string
  resourceId?: string | null
  changes?: unknown | null
  metadata?: unknown | null
}

function generateCSV(logs: AuditLogWithUser[]): string {
  // CSV header
  const header = [
    "Timestamp",
    "User Email",
    "User Name",
    "Action",
    "Resource",
    "Resource ID",
    "Changes",
    "Metadata",
  ].join(",")

  // CSV rows
  const rows = logs.map((log) => {
    return [
      escapeCSV(log.createdAt.toISOString()),
      escapeCSV(log.user?.email || "system"),
      escapeCSV(log.user?.name || ""),
      escapeCSV(log.action),
      escapeCSV(log.resource),
      escapeCSV(log.resourceId || ""),
      escapeCSV(JSON.stringify(log.changes || {})),
      escapeCSV(JSON.stringify(log.metadata || {})),
    ].join(",")
  })

  return [header, ...rows].join("\n")
}

/**
 * Escape CSV field - handle quotes, commas, newlines
 */
function escapeCSV(field: string | null | undefined): string {
  if (!field) return ""

  const str = String(field)

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"'
  }

  return str
}
