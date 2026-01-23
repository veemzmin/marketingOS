import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"

/**
 * Log a role change to the audit trail
 *
 * Records role changes for compliance and tracking
 * Automatically captures tenant context and timestamp
 *
 * @param targetUserId - The user whose role is being changed
 * @param oldRole - Previous role
 * @param newRole - New role
 * @param performedById - User ID of the admin making the change
 * @param metadata - Additional context (IP, user agent, etc.)
 */
export async function logRoleChange(
  targetUserId: string,
  oldRole: string,
  newRole: string,
  performedById: string,
  metadata?: Record<string, any>
): Promise<void> {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    throw new Error("Cannot log role change without tenant context")
  }

  await prisma.auditLog.create({
    data: {
      organizationId: tenantId,
      userId: performedById,
      action: "update_role",
      resource: "user",
      resourceId: targetUserId,
      changes: {
        field: "role",
        from: oldRole,
        to: newRole,
      },
      metadata: metadata || {},
    },
  })
}

/**
 * Log a user invitation to the audit trail
 *
 * @param invitedEmail - Email of the invited user
 * @param assignedRole - Role assigned in the invitation
 * @param performedById - User ID of the admin sending invite
 * @param metadata - Additional context
 */
export async function logUserInvitation(
  invitedEmail: string,
  assignedRole: string,
  performedById: string,
  metadata?: Record<string, any>
): Promise<void> {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    throw new Error("Cannot log invitation without tenant context")
  }

  await prisma.auditLog.create({
    data: {
      organizationId: tenantId,
      userId: performedById,
      action: "invite_user",
      resource: "user",
      resourceId: null,
      changes: {
        email: invitedEmail,
        role: assignedRole,
      },
      metadata: metadata || {},
    },
  })
}
