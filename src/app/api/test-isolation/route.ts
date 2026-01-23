import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { auth } from "@/auth"

/**
 * Tenant Isolation Test Endpoint
 *
 * GET /api/test-isolation
 *
 * Tests that Row-Level Security (RLS) policies are working correctly.
 * Should only return data for the current tenant based on x-tenant-id header.
 *
 * Returns:
 * - Current tenant ID from header
 * - Count of visible organizations (should be 1)
 * - Count of visible user_organizations (should be only current tenant)
 * - List of visible organization IDs
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Read tenant ID from header (injected by middleware)
  const tenantId = request.headers.get("x-tenant-id")
  const userId = request.headers.get("x-user-id")
  const userEmail = request.headers.get("x-user-email")

  if (!tenantId) {
    return NextResponse.json(
      { error: "No tenant context available" },
      { status: 403 }
    )
  }

  // Query organizations (should only return current tenant due to RLS)
  const organizations = await prisma.organization.findMany()

  // Query user organizations (should only return memberships for current tenant)
  const userOrganizations = await prisma.userOrganization.findMany()

  // Query audit logs (should only return logs for current tenant)
  const auditLogs = await prisma.auditLog.findMany()

  return NextResponse.json({
    context: {
      tenantId,
      userId,
      userEmail,
    },
    isolation: {
      organizations: {
        count: organizations.length,
        ids: organizations.map(org => org.id),
        expectedCount: 1,
        isolated: organizations.length === 1 && organizations[0].id === tenantId,
      },
      userOrganizations: {
        count: userOrganizations.length,
        organizationIds: [...new Set(userOrganizations.map(uo => uo.organizationId))],
        allMatchTenant: userOrganizations.every(uo => uo.organizationId === tenantId),
      },
      auditLogs: {
        count: auditLogs.length,
        organizationIds: [...new Set(auditLogs.map(al => al.organizationId))],
        allMatchTenant: auditLogs.every(al => al.organizationId === tenantId),
      },
    },
    summary: {
      rlsActive: organizations.length === 1 && organizations[0].id === tenantId,
      allDataIsolated:
        organizations.length === 1 &&
        organizations[0].id === tenantId &&
        userOrganizations.every(uo => uo.organizationId === tenantId) &&
        auditLogs.every(al => al.organizationId === tenantId),
    },
  })
}
