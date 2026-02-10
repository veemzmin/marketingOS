"use server"

import { prisma } from "@/lib/db/client"
import { auth } from "@/auth"
import { headers } from "next/headers"
import { requireAdmin } from "@/lib/auth/permissions"
import { logRoleChange, logUserInvitation } from "@/lib/audit/logger"
import { sendInvitationEmail } from "@/lib/email/client"
import { Role } from "@prisma/client"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

/**
 * Invite a user to the organization
 *
 * For new users: Creates verification token and sends invitation email
 * For existing users: Adds them to the organization and sends notification
 *
 * @param email - Email address to invite
 * @param role - Role to assign (ADMIN, REVIEWER, CREATOR, VIEWER)
 * @returns Success or error message
 */
export async function inviteUserAction(email: string, role: Role) {
  // Verify admin permission
  await requireAdmin()

  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return { error: "No organization context" }
  }

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: tenantId },
    select: { name: true, id: true },
  })

  if (!organization) {
    return { error: "Organization not found" }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    // Check if already a member
    const existingMembership = await prisma.userOrganization.findFirst({
      where: {
        userId: existingUser.id,
        organizationId: tenantId,
      },
    })

    if (existingMembership) {
      return { error: "User is already a member of this organization" }
    }

    // Add existing user to organization
    await prisma.userOrganization.create({
      data: {
        userId: existingUser.id,
        organizationId: tenantId,
        role,
      },
    })

    // Log the invitation
    await logUserInvitation(email, role, session.user.id, {
      existingUser: true,
    })

    // Send notification email
    await sendInvitationEmail(
      email,
      session.user.name || session.user.email,
      organization.name,
      "", // No token needed for existing users
      false
    )

    revalidatePath("/admin/users")
    return { success: true, message: "User added to organization successfully" }
  }

  // New user - create invitation token
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Store invitation token (reusing EmailVerificationToken model)
  // We'll need to create a temporary user record or modify the flow
  // For now, let's create the user with unverified email and store the invite token

  // Create unverified user
  const newUser = await prisma.user.create({
    data: {
      email,
      name: null,
      emailVerified: null,
      passwordHash: "", // Will be set when they accept invitation
      totpEnabled: false,
    },
  })

  // Add to organization with specified role
  await prisma.userOrganization.create({
    data: {
      userId: newUser.id,
      organizationId: tenantId,
      role,
    },
  })

  // Create verification token for invitation acceptance
  await prisma.emailVerificationToken.create({
    data: {
      userId: newUser.id,
      token,
      expiresAt,
    },
  })

  // Log the invitation
  await logUserInvitation(email, role, session.user.id, {
    newUser: true,
  })

  // Send invitation email
  await sendInvitationEmail(
    email,
    session.user.name || session.user.email,
    organization.name,
    token,
    true
  )

  revalidatePath("/admin/users")
  return { success: true, message: "Invitation sent successfully" }
}

/**
 * Change a user's role in the organization
 *
 * @param userId - User ID to update
 * @param newRole - New role to assign
 * @returns Success or error message
 */
export async function changeUserRoleAction(userId: string, newRole: Role) {
  // Verify admin permission
  await requireAdmin()

  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  // Prevent self-demotion from admin
  if (session.user.id === userId) {
    return { error: "Cannot change your own role" }
  }

  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return { error: "No organization context" }
  }

  // Get current membership
  const membership = await prisma.userOrganization.findFirst({
    where: {
      userId,
      organizationId: tenantId,
    },
  })

  if (!membership) {
    return { error: "User is not a member of this organization" }
  }

  const oldRole = membership.role

  // Update role
  await prisma.userOrganization.update({
    where: { id: membership.id },
    data: { role: newRole },
  })

  // Log the role change
  await logRoleChange(userId, oldRole, newRole, session.user.id)

  revalidatePath("/admin/users")
  return { success: true, message: "Role updated successfully" }
}

/**
 * Remove a user from the organization
 *
 * @param userId - User ID to remove
 * @returns Success or error message
 */
export async function removeUserFromOrganizationAction(userId: string) {
  // Verify admin permission
  await requireAdmin()

  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  // Prevent self-removal
  if (session.user.id === userId) {
    return { error: "Cannot remove yourself from the organization" }
  }

  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return { error: "No organization context" }
  }

  // Delete membership
  await prisma.userOrganization.deleteMany({
    where: {
      userId,
      organizationId: tenantId,
    },
  })

  // Log the removal
  const auditHeadersList = await headers()
  const auditTenantId = auditHeadersList.get("x-tenant-id")
  
  if (auditTenantId) {
    await prisma.auditLog.create({
      data: {
        organizationId: auditTenantId,
        userId: session.user.id,
        action: "remove_user",
        resource: "user",
        resourceId: userId,
        changes: {},
        metadata: {},
      },
    })
  }

  revalidatePath("/admin/users")
  return { success: true, message: "User removed from organization" }
}
