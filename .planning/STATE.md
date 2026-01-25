# Project State

## Current Position

Phase: 3 of 5 (Content Creation)
Plan: 1 of 4 complete
Status: In progress - schema and dependencies established
Last activity: 2026-01-25 - Completed 03-01-PLAN.md (Content schema with versioning)

Progress: ████████████████████░░░░ 21% (1.2 of 5 phases complete)

## Accumulated Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-04 | Email provider abstraction (console/Resend modes) | Enables local dev without API keys while production-ready |
| 01-04 | 24-hour token expiry for email verification | Healthcare compliance standard |
| 01-04 | Auto-delete verification tokens after use | Prevents token reuse, maintains clean DB |
| 01-04 | 3-second auto-redirect after verification | User feedback + automatic flow advancement |
| 01-05 | Use speakeasy for TOTP with 2-window tolerance | Healthcare-grade RFC 6238 compliance with ±60s clock skew |
| 01-05 | 10-minute temporary TotpSetup records | Security best practice - don't persist unverified secrets |
| 01-05 | 2FA bypass token pattern for session creation | Maintains NextAuth flow while inserting 2FA verification step |
| 01-05 | Verify credentials first, then redirect to 2FA | Clean separation - no session until both factors verified |
| 01-06 | Dual tenancy strategy (subdomain + path-based) | Flexibility for deployment scenarios |
| 01-06 | UserOrganization membership verification in middleware | Defense-in-depth security |
| 01-06 | Header injection pattern (x-tenant-id) | Clean separation between middleware and routes |
| 01-06 | Prisma $allOperations hook for RLS context | Automatic, no developer action needed |
| 01-07 | Use basePrisma for audit writes to prevent recursion | Audit middleware runs on $allOperations - writing through extended client would cause infinite loop |
| 01-07 | Non-blocking error handling for audit failures | Audit logging should not cause operational failures |
| 01-07 | Admin-only access to audit logs and exports | Audit logs contain sensitive operational data for compliance reviews |
| 01-07 | CSV field escaping per RFC 4180 | Compliance tools expect properly escaped CSV |
| 01-08 | 7-day invitation token expiry (vs 24-hour for email verification) | Admin invitations are less time-sensitive, longer window reduces support burden |
| 01-08 | Prevent self-role-change | Admins changing their own role could lead to lockout |
| 01-08 | Reuse EmailVerificationToken model for invitation tokens | Identical token requirements, avoids schema duplication |
| 01-08 | Create placeholder users for invited non-existing users | Enables immediate org membership while deferring full registration |
| 03-01 | Use ContentVersion with unique [contentId, versionNumber] for immutable audit trail | Prevents version tampering, supports compliance requirements |
| 03-01 | Dual complianceScore storage (Content + ContentVersion) | Content.complianceScore stores latest, ContentVersion stores at-time for historical tracking |
| 03-01 | Topic/audience/tone metadata on ContentVersion | Provides governance context for scoring (mental-health vs crisis content has different rules) |
| 03-01 | React Hook Form + Zod validation stack | Industry standard for Next.js, type-safe schema validation |

## Critical Issues & Blockers

**01-05 Concerns:**
- Recovery mechanism needed - Users who lose authenticator app are locked out
  - Recommendation: Add backup codes in future plan
  - Alternative: Add 2FA reset via email verification
- No 2FA disable flow - Once enabled, users cannot disable 2FA via UI
  - Current workaround: Admin can update database
  - Recommendation: Add "Disable 2FA" button (requires password confirmation)

**01-07 Future Enhancements:**
- Advanced filtering in UI (currently shows recent 100)
- Date range pickers in UI (filters exist in API)
- Audit log retention policy (RLS prevents deletion, but may need archival)
- Pagination for large audit histories

**01-08 Future Enhancements:**
- Invitation acceptance flow (/auth/accept-invite page)
- Bulk user import
- Role change notifications via email
- User removal action in UI (removeUserFromOrganizationAction exists but not wired to UI)

## Tech Stack Status

### Core Stack
- Next.js 14.2.35 (App Router)
- TypeScript
- Prisma (PostgreSQL)
- Auth.js v5 (next-auth beta)
- Tailwind CSS 4.x

### Authentication
- bcryptjs (password hashing)
- Auth.js credentials provider
- Email verification (resend)
- TOTP 2FA (speakeasy, qrcode)

### Permissions & RBAC
- Role hierarchy: ADMIN > REVIEWER > CREATOR > VIEWER
- Permission utilities (requireAdmin, requireRole, hasPermission)
- User invitation system with role assignment

### Audit & Compliance
- Prisma middleware for automatic audit logging
- CSV export for compliance reporting
- Admin-only audit viewer UI
- Role change and invitation audit trail

### Email
- Resend (production email sending)
- Console mode for development
- Invitation emails with 7-day expiry

### Content Creation
- Content/ContentVersion/ReviewDecision models
- Immutable versioning with audit trail
- Status workflow (DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED)
- Form validation (react-hook-form@7.71.1, zod@4.3.6)
- User notifications (react-hot-toast@2.6.0)

## Session Continuity

Last session: 2026-01-25
Stopped at: Completed 03-01-PLAN.md (Content schema and dependencies)
Resume file: None
Next step: Execute 03-02-PLAN.md (Governance integration) or 03-03-PLAN.md (Content editor UI)
