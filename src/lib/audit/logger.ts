/**
 * Manual Audit Logging Helpers
 *
 * Provides utilities for logging specific audit events that aren't captured
 * by automatic Prisma middleware (e.g., authentication events, permission changes).
 *
 * All functions use basePrisma to prevent recursion through the audit middleware.
 */

import { basePrisma } from "@/lib/db/client"
import { Prisma } from "../../../generated/prisma/client"

/**
 * Generic audit event logger
 *
 * @param organizationId - Organization context
 * @param userId - User who performed the action (null for system actions)
 * @param action - Action performed (e.g., "login", "logout", "approve", "reject")
 * @param resource - Resource type (e.g., "auth", "user", "campaign")
 * @param resourceId - ID of affected resource (optional)
 * @param changes - Changes made (optional)
 * @param metadata - Additional context (optional)
 */
export async function logAuditEvent(params: {
  organizationId: string
  userId: string | null
  action: string
  resource: string
  resourceId?: string | null
  changes?: Prisma.JsonValue
  metadata?: Prisma.JsonValue
}) {
  try {
    await basePrisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || null,
        changes: params.changes || null,
        metadata: {
          ...(typeof params.metadata === "object" && params.metadata !== null ? params.metadata : {}),
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    // Non-blocking - log error but don't fail the operation
    console.error("Audit logging failed:", error)
  }
}

/**
 * Log successful login event
 *
 * @param organizationId - Organization context
 * @param userId - User who logged in
 * @param metadata - Additional context (IP, user agent, etc.)
 */
export async function logLogin(params: {
  organizationId: string
  userId: string
  metadata?: {
    ip?: string
    userAgent?: string
    method?: "credentials" | "oauth" | "magic-link"
    twoFactorUsed?: boolean
  }
}) {
  await logAuditEvent({
    organizationId: params.organizationId,
    userId: params.userId,
    action: "login",
    resource: "auth",
    resourceId: params.userId,
    metadata: params.metadata,
  })
}

/**
 * Log logout event
 *
 * @param organizationId - Organization context
 * @param userId - User who logged out
 * @param metadata - Additional context
 */
export async function logLogout(params: {
  organizationId: string
  userId: string
  metadata?: {
    ip?: string
    sessionDuration?: number
  }
}) {
  await logAuditEvent({
    organizationId: params.organizationId,
    userId: params.userId,
    action: "logout",
    resource: "auth",
    resourceId: params.userId,
    metadata: params.metadata,
  })
}

/**
 * Log role change event
 *
 * @param organizationId - Organization context
 * @param actorId - User who made the change
 * @param targetUserId - User whose role was changed
 * @param changes - Before/after role values
 * @param metadata - Additional context
 */
export async function logRoleChange(params: {
  organizationId: string
  actorId: string
  targetUserId: string
  changes: {
    from: string
    to: string
  }
  metadata?: {
    reason?: string
  }
}) {
  await logAuditEvent({
    organizationId: params.organizationId,
    userId: params.actorId,
    action: "role_change",
    resource: "user_organization",
    resourceId: params.targetUserId,
    changes: {
      role: params.changes,
    },
    metadata: {
      ...params.metadata,
      targetUserId: params.targetUserId,
    },
  })
}

/**
 * Log failed login attempt
 *
 * @param email - Email used for login attempt
 * @param metadata - Additional context (IP, user agent, reason)
 */
export async function logFailedLogin(params: {
  email: string
  metadata?: {
    ip?: string
    userAgent?: string
    reason?: "invalid_credentials" | "account_locked" | "email_not_verified" | "2fa_failed"
  }
}) {
  // For failed logins, we don't have organization context yet
  // These can be logged at system level or queued for later association
  console.warn("Failed login attempt:", {
    email: params.email,
    ...params.metadata,
    timestamp: new Date().toISOString(),
  })
}
