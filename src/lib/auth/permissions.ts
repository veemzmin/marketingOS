import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

/**
 * Role hierarchy for permission checks
 * Higher index = higher privilege
 */
const ROLE_HIERARCHY: Role[] = [Role.VIEWER, Role.CREATOR, Role.REVIEWER, Role.ADMIN]

/**
 * Get the current user's role in the current organization
 *
 * Reads tenant context from middleware-injected headers
 * Returns null if no session or not a member of the organization
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return null
  }

  const membership = await prisma.userOrganization.findFirst({
    where: {
      userId: session.user.id,
      organizationId: tenantId,
    },
    select: {
      role: true,
    },
  })

  return membership?.role ?? null
}

/**
 * Check if user has a specific role or higher
 *
 * Uses role hierarchy: ADMIN > REVIEWER > CREATOR > VIEWER
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient permissions
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole)
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)

  return userLevel >= requiredLevel
}

/**
 * Require a specific role or higher, redirecting if insufficient
 *
 * Server-side utility for protecting pages and actions
 * Redirects to /unauthorized if user lacks permission
 *
 * @param requiredRole - The minimum required role
 * @throws Redirect to /unauthorized if insufficient permissions
 */
export async function requireRole(requiredRole: Role): Promise<void> {
  const currentRole = await getCurrentUserRole()

  if (!currentRole) {
    redirect("/unauthorized")
  }

  if (!hasPermission(currentRole, requiredRole)) {
    redirect("/unauthorized")
  }
}

/**
 * Require ADMIN role, redirecting if insufficient
 *
 * Convenience wrapper for requireRole(Role.ADMIN)
 */
export async function requireAdmin(): Promise<void> {
  await requireRole(Role.ADMIN)
}

/**
 * Get user's role in a specific organization (not current tenant context)
 *
 * Useful for admin operations that need to check roles across organizations
 *
 * @param userId - The user ID to check
 * @param organizationId - The organization ID to check
 * @returns The user's role in that organization, or null if not a member
 */
export async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<Role | null> {
  const membership = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      role: true,
    },
  })

  return membership?.role ?? null
}
