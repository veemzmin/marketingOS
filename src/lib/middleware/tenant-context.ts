import { prisma } from "@/lib/db/client"
import { NextRequest } from "next/server"

/**
 * Tenant context extraction result
 */
export interface TenantContext {
  tenantId: string
  organizationSlug: string
}

/**
 * Extract tenant context from request (subdomain or path-based)
 *
 * Supports two tenancy strategies:
 * 1. Subdomain: acme.marketingos.com -> slug: "acme"
 * 2. Path-based: /org/acme/dashboard -> slug: "acme"
 *
 * @param request - Next.js request object
 * @param userId - Current authenticated user ID
 * @returns TenantContext if valid, null if unauthorized
 */
export async function extractTenantContext(
  request: NextRequest,
  userId: string
): Promise<TenantContext | null> {
  let slug: string | null = null

  // Strategy 1: Extract from subdomain
  const host = request.headers.get("host") || ""
  const hostParts = host.split(".")

  // Check for subdomain (e.g., acme.marketingos.com)
  // Must have at least 3 parts and first part is not 'www'
  if (hostParts.length >= 3 && hostParts[0] !== "www") {
    slug = hostParts[0]
  }

  // Strategy 2: Extract from path if no subdomain
  if (!slug) {
    const pathname = request.nextUrl.pathname
    const orgPathMatch = pathname.match(/^\/org\/([^\/]+)/)
    if (orgPathMatch) {
      slug = orgPathMatch[1]
    }
  }

  // No tenant identifier found
  if (!slug) {
    return null
  }

  // Lookup organization by slug
  const organization = await prisma.organization.findUnique({
    where: { slug },
  })

  if (!organization) {
    return null
  }

  // Verify user has membership in this organization
  const membership = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId: organization.id,
    },
  })

  if (!membership) {
    return null
  }

  return {
    tenantId: organization.id,
    organizationSlug: slug,
  }
}
