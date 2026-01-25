---
phase: 03-content-creation
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, versioning, react-hook-form, zod, validation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Multi-tenant database schema with RLS, User and Organization models
  - phase: 02-governance-engine
    provides: Policy validation patterns for compliance scoring
provides:
  - Content model with status workflow (DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED)
  - ContentVersion model for immutable audit trail
  - ReviewDecision model for approval workflow
  - Form validation libraries (react-hook-form, zod) for content editor
  - Database migration with RLS-compatible foreign keys
affects: [03-02, 03-03, 03-04, content-editor, content-review, governance-integration]

# Tech tracking
tech-stack:
  added: [react-hook-form@7.71.1, zod@4.3.6, @hookform/resolvers@5.2.2, react-hot-toast@2.6.0]
  patterns: [immutable-versioning, content-status-workflow, append-only-versions]

key-files:
  created:
    - prisma/migrations/20260125185343_add_content_models/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Use ContentVersion with unique [contentId, versionNumber] for immutable audit trail"
  - "Store complianceScore at both Content (latest) and ContentVersion (at-time) levels"
  - "Support topic, audience, tone metadata on versions for governance context"
  - "Use react-hook-form + zod stack for form validation (industry standard)"

patterns-established:
  - "Immutable versioning: ContentVersion never updated, only created"
  - "Status workflow: DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED"
  - "Multi-tenant isolation: all content models have organizationId foreign key"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 03 Plan 01: Content Schema & Dependencies Summary

**Prisma schema with Content/ContentVersion/ReviewDecision models using immutable versioning pattern, plus form validation libraries (react-hook-form, zod) for content editor**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T23:51:00Z
- **Completed:** 2026-01-25T23:55:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Content database schema with status workflow and versioning established
- ContentVersion model provides immutable audit trail with append-only design
- Form validation dependencies installed and ready for content editor implementation
- Multi-tenant RLS compatibility maintained via organizationId foreign keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Content schema with versioning and status workflow** - `c137639` (feat)
2. **Task 2: Install form validation dependencies** - `0b24025` (chore)

## Files Created/Modified
- `prisma/schema.prisma` - Added Content, ContentVersion, ReviewDecision models with ContentStatus enum
- `prisma/migrations/20260125185343_add_content_models/migration.sql` - Database migration with RLS-compatible schema
- `package.json` - Added react-hook-form, zod, @hookform/resolvers, react-hot-toast
- `package-lock.json` - Updated dependency lockfile

## Decisions Made

**1. Immutable versioning with unique constraint**
- Used `@@unique([contentId, versionNumber])` on ContentVersion for append-only audit trail
- Prevents version tampering, supports compliance requirements
- Every content edit creates new version record

**2. Dual complianceScore storage**
- Content.complianceScore stores latest score (nullable, updated on each version)
- ContentVersion.complianceScore stores score at time of version creation (immutable)
- Enables historical compliance tracking and current status queries

**3. Topic/audience/tone metadata on versions**
- Supports governance scoring by providing context (from research: mental-health vs crisis content has different rules)
- Stored on ContentVersion (not Content) to preserve context for historical versions

**4. React Hook Form + Zod validation stack**
- Industry standard for Next.js form validation
- Type-safe schema validation with Zod
- @hookform/resolvers provides integration between the two
- react-hot-toast for user feedback on validation errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Database drift with User.name column**
- **Found during:** Task 1 (Creating database migration)
- **Issue:** Prisma detected drift - User.name column existed in database but not in migration history
- **Fix:** Created migration with conditional DDL to handle existing name column, then added content models
- **Files modified:** prisma/migrations/20260125185343_add_content_models/migration.sql
- **Verification:** Migration applied successfully, `prisma migrate status` shows "up to date"
- **Committed in:** c137639 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Database drift fix necessary to proceed with migration. No scope change.

## Issues Encountered

**Prisma migrate drift detection:**
- Problem: Initial migration didn't include User.name field, but it existed in database
- Resolution: Added conditional DDL (`IF NOT EXISTS`) to migration SQL to handle drift gracefully
- Applied migration directly via psql to ensure database and migration history aligned
- Lesson: Development database manual changes should be captured in migrations

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phases:**
- Database schema supports content creation, versioning, and review workflow
- Form validation libraries installed for editor UI
- Multi-tenant isolation enforced via RLS-compatible foreign keys

**Available for:**
- Plan 03-02: Governance integration (complianceScore field ready)
- Plan 03-03: Content editor UI (schema and validation libraries ready)
- Plan 03-04: Content review workflow (ReviewDecision model ready)

**No blockers identified.**

---
*Phase: 03-content-creation*
*Completed: 2026-01-25*
