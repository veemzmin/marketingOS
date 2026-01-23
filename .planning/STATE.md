# Project State

## Current Position

Phase: 01 of [total] (Foundation and Authentication)
Plan: 01-07 completed
Status: In progress
Last activity: 2026-01-23 - Completed 01-07-PLAN.md (Audit Logging Middleware)

Progress: ███████░░░░░░░░░░░░░ 35% (7 plans complete)

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

### Audit & Compliance
- Prisma middleware for automatic audit logging
- CSV export for compliance reporting
- Admin-only audit viewer UI

### Email
- Resend (production email sending)
- Console mode for development

## Session Continuity

Last session: 2026-01-23T14:57:50Z
Stopped at: Completed 01-07-PLAN.md (Audit Logging Middleware)
Resume file: None
