# Phase 3: Content Creation - Research

**Researched:** 2026-01-25
**Domain:** Real-time content editing interface with governance feedback integration, draft management, and content status tracking
**Confidence:** HIGH (established patterns) / MEDIUM (healthcare-specific editor implementations)

## Summary

Phase 3 requires building a content creation interface where creators draft content, receive real-time governance feedback, save drafts for later editing, and submit content for review. The technical domain combines form validation patterns, real-time constraint feedback, draft versioning, and status workflow management.

The research identifies standard patterns for editor UIs in Next.js 14 (React Hook Form + Zod for validation, debounced server-side validation, optimistic UI updates), established approaches for draft/version management (Prisma with immutable version records), and proven workflows for content status tracking (state machine pattern with enum states).

Key findings:
- **React Hook Form + Zod** is the production standard for form validation in Next.js (client-side instant feedback + server-side validation)
- **Debounced validation with server actions** provides real-time feedback without overwhelming the API
- **useOptimistic Hook** enables responsive auto-save without waiting for server confirmation
- **Version-based drafting** (immutable version records) prevents data loss and enables audit trails
- **Enum-based state machines** are the standard for content workflow (Draft → Submitted → In Review → Approved/Rejected)

**Primary recommendation:** Use React Hook Form + Zod for form validation, implement debounced server-side governance validation (300-500ms), combine with useOptimistic for draft auto-save, and store versions as immutable records with state enum transitions. This approach provides excellent UX (instant feedback, no data loss) while maintaining auditability and governance safety.

## Standard Stack

### Core Form & Validation Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React Hook Form** | 7.50+ | Client-side form state management and validation | Industry standard for Next.js forms; minimal re-renders; integrates seamlessly with Zod; part of shadcn/ui recommended stack |
| **Zod** | 3.22+ | Type-safe schema validation (shared client/server) | Standard in Next.js ecosystem; provides type inference; works with server actions for both client and server validation |
| **TypeScript** | 5.9+ | Type safety for form schemas and state | Already in project; enables end-to-end type safety from form → server action → database |

### Debouncing & Real-Time Feedback

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **use-debounce** (optional) | 10.0+ | Debounced state hook for input fields | Simplifies debouncing logic; lightweight. Alternative: manual useEffect with setTimeout (shown in examples) |
| **React's useOptimistic** | 18.3+ (built-in) | Optimistic UI updates before server confirmation | Auto-save pattern: immediately show saved state, revert if server fails |
| **React.useEffect** | built-in | Debounce server actions on input change | Pair with setTimeout/clearTimeout for governance validation calls |

### Content Versioning & Status Tracking

| Persistence | Version | Purpose | Integration |
|-----------|---------|---------|-------------|
| **Prisma** | 5.7+ | Content & version record management | Already in stack; use Client Extensions for auto-audit logging |
| **PostgreSQL enums** | 14+ | Status states (Draft, Submitted, InReview, Approved, Rejected) | Database-enforced state constraints prevent invalid transitions |
| **Next.js Server Actions** | 14.2+ | Handle draft saves, status updates, submissions | Secure mutations; integrates with Prisma; supports optimistic updates |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react-hot-toast** (or similar) | 0.4.0+ | Toast notifications for save status, errors | User feedback for auto-save results; optional but improves UX |
| **tailwindcss** | 4.1+ | Styling form elements, validation states, status badges | Already in project; provides utility classes for error states |

### Recommended Project Dependencies (Add to package.json)

```bash
# Validation & form handling
npm install react-hook-form zod

# Optional: for simpler debouncing than useEffect
npm install use-debounce

# Optional: for toast notifications
npm install react-hot-toast
```

### Why Not X?

| Instead of | Could Use | Why Not Chosen |
|------------|-----------|----------------|
| React Hook Form | Formik | Formik is older; causes more re-renders; RHF is modern standard for 2026 |
| Zod | Yup or Joi | Zod has better TypeScript support and type inference; Yup is less ergonomic for Next.js |
| Manual debounce | lodash.debounce | Manual useEffect gives full control; lodash adds bundle size for one function |
| React Hook Form | HTML Form API | Bare HTML form requires manual state management; loses error tracking and performance optimizations |
| Immutable versions | Soft deletes + flags | Soft deletes can be un-deleted; immutable versions enforce audit compliance; append-only prevents rewrites |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── [organizationId]/
│   │   │   ├── content/
│   │   │   │   ├── create/page.tsx          # Create new content form
│   │   │   │   ├── [contentId]/
│   │   │   │   │   ├── edit/page.tsx        # Edit draft
│   │   │   │   │   └── view/page.tsx        # View with status
│   │   │   │   └── list/page.tsx            # All content + status dashboard
│   │   │   └── api/
│   │   │       ├── content/
│   │   │       │   ├── route.ts             # List/create content
│   │   │       │   ├── [contentId]/route.ts # Get/update content
│   │   │       │   └── validate/route.ts    # Real-time governance validation
│   │   │       └── actions/
│   │   │           ├── content.ts           # Server actions for mutations
│   │   │           └── validation.ts        # Server actions for validation
│   │
│   └── components/
│       ├── content/
│       │   ├── ContentEditor.tsx            # Main editor form
│       │   ├── MetadataFields.tsx           # Topic, audience, tone
│       │   ├── GovernanceFeedback.tsx       # Real-time violations display
│       │   ├── SaveStatus.tsx               # Draft save indicator
│       │   ├── ContentStatus.tsx            # Status badge
│       │   └── SubmitButton.tsx             # Submit for review
│       │
│       └── forms/
│           └── ContentFormFields.tsx        # Reusable form field components
│
├── lib/
│   ├── actions/
│   │   ├── content.ts                       # Server actions: createDraft, updateDraft, submitContent
│   │   └── validation.ts                    # Server action: validateGovernance
│   │
│   ├── validators/
│   │   ├── content-schema.ts                # Zod schema for content form
│   │   └── content-server.ts                # Server-side additional validation
│   │
│   ├── content/
│   │   ├── types.ts                         # Content, ContentStatus, ContentVersion types
│   │   ├── constants.ts                     # Status enum, stage descriptions
│   │   └── helpers.ts                       # Status transitions, version history
│   │
│   └── db/
│       └── content-queries.ts               # Reusable Prisma queries (find draft, list content, etc.)
│
└── db/
    └── schema.prisma                        # Content, ContentVersion, ContentStatus models
```

### Pattern 1: Form Validation with React Hook Form + Zod

**What:** Client-side form validation with instant feedback (React Hook Form) + server-side re-validation for security

**When to use:** Every content creation/edit form; ensures UX responsiveness while preventing invalid submissions

**Example:**

```typescript
// src/lib/validators/content-schema.ts
import { z } from 'zod'

export const contentFormSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(50).max(50000),
  topic: z.enum(['mental-health', 'substance-use', 'wellness', 'crisis']),
  audience: z.enum(['patients', 'families', 'professionals', 'general']),
  tone: z.enum(['informative', 'supportive', 'clinical', 'motivational']),
})

export type ContentFormData = z.infer<typeof contentFormSchema>
```

```typescript
// src/app/components/content/ContentEditor.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contentFormSchema, type ContentFormData } from '@/lib/validators/content-schema'

export function ContentEditor() {
  const {
    register,
    formState: { errors },
    watch,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    mode: 'onChange', // Validate on every change for real-time feedback
  })

  const bodyValue = watch('body')

  return (
    <form className="space-y-6">
      <div>
        <label htmlFor="title">Title</label>
        <input
          {...register('title')}
          id="title"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <span className="text-red-500">{errors.title.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="body">Content</label>
        <textarea
          {...register('body')}
          id="body"
          className={errors.body ? 'border-red-500' : ''}
        />
        <p className="text-gray-500">{bodyValue?.length || 0} / 50000 characters</p>
        {errors.body && (
          <span className="text-red-500">{errors.body.message}</span>
        )}
      </div>

      {/* Metadata fields */}
      <select {...register('topic')}>
        <option value="mental-health">Mental Health</option>
        <option value="substance-use">Substance Use</option>
        <option value="wellness">Wellness</option>
        <option value="crisis">Crisis Support</option>
      </select>

      <select {...register('audience')}>
        <option value="patients">Patients</option>
        <option value="families">Families</option>
        <option value="professionals">Professionals</option>
        <option value="general">General Public</option>
      </select>

      <select {...register('tone')}>
        <option value="informative">Informative</option>
        <option value="supportive">Supportive</option>
        <option value="clinical">Clinical</option>
        <option value="motivational">Motivational</option>
      </select>
    </form>
  )
}
```

### Pattern 2: Debounced Real-Time Governance Validation

**What:** As user types, debounce the content and call server-side governance validation API, showing violations in real-time

**When to use:** Content body changes; shows violations before save so user can fix proactively

**Example:**

```typescript
// src/app/components/content/ContentEditor.tsx (continued)
'use client'

import { useEffect, useRef } from 'react'
import { validateGovernanceAction } from '@/lib/actions/validation'

export function ContentEditor() {
  const bodyValue = watch('body')
  const governanceViolations = useState<Violation[]>([])
  const [validationLoading, setValidationLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Debounced governance validation
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setValidationLoading(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await validateGovernanceAction(bodyValue)
        setGovernanceViolations(result.violations || [])
      } catch (error) {
        console.error('Governance validation failed:', error)
        // Don't block user; validation is advisory
      } finally {
        setValidationLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [bodyValue])

  return (
    <>
      {/* Form fields */}

      {/* Real-time governance feedback */}
      <GovernanceFeedback
        violations={governanceViolations}
        loading={validationLoading}
      />
    </>
  )
}
```

```typescript
// src/lib/actions/validation.ts
'use server'

import { validateContent } from '@/lib/governance/validators/composite'

export async function validateGovernanceAction(content: string) {
  try {
    const violations = await validateContent(content)
    return { success: true, violations }
  } catch (error) {
    console.error('Governance validation error:', error)
    // Return empty violations on error; don't block user
    return { success: false, violations: [] }
  }
}
```

### Pattern 3: Optimistic Auto-Save with useOptimistic

**What:** When user finishes editing and pauses (debounce), automatically save draft. UI immediately shows "Saved" state, reverts if server fails.

**When to use:** Draft auto-save; user should never lose unsaved work

**Example:**

```typescript
// src/app/components/content/ContentEditor.tsx (continued)
'use client'

import { useOptimistic } from 'react'
import { saveDraftAction } from '@/lib/actions/content'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function ContentEditor({ initialContent }: { initialContent?: Content }) {
  const [formData, setFormData] = useState(initialContent?.latestVersion?.body || '')
  const [saveState, setOptimisticSaveState] = useOptimistic<SaveState>('idle')

  // Auto-save with debounce
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()

  const handleContentChange = (newValue: string) => {
    setFormData(newValue)

    // Debounced auto-save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    setOptimisticSaveState('saving')

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const result = await saveDraftAction({
          contentId: initialContent?.id,
          body: newValue,
        })

        if (result.success) {
          setOptimisticSaveState('saved')
          // Show "saved" for 2 seconds, then back to idle
          setTimeout(() => setOptimisticSaveState('idle'), 2000)
        } else {
          setOptimisticSaveState('error')
        }
      } catch (error) {
        setOptimisticSaveState('error')
      }
    }, 1000) // 1 second debounce before saving
  }

  return (
    <>
      <textarea
        value={formData}
        onChange={(e) => handleContentChange(e.target.value)}
      />
      <SaveStatus state={saveState} />
    </>
  )
}
```

```typescript
// src/lib/actions/content.ts
'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db/client'
import { headers } from 'next/headers'

export async function saveDraftAction({
  contentId,
  body,
}: {
  contentId?: string
  body: string
}) {
  const session = await auth()
  const headersList = headers()
  const organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id || !organizationId) {
    throw new Error('Unauthorized')
  }

  try {
    if (!contentId) {
      // Create new draft
      const content = await db.content.create({
        data: {
          organizationId,
          createdByUserId: session.user.id,
          status: 'DRAFT',
          versions: {
            create: {
              versionNumber: 1,
              body,
              createdByUserId: session.user.id,
            },
          },
        },
      })
      return { success: true, contentId: content.id }
    } else {
      // Update existing draft
      const content = await db.content.findUnique({
        where: { id: contentId, organizationId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      })

      if (!content) return { success: false, error: 'Content not found' }
      if (content.status !== 'DRAFT') {
        return { success: false, error: 'Can only edit draft content' }
      }

      // Create new version
      const latestVersion = content.versions[0]
      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

      await db.content.update({
        where: { id: contentId },
        data: {
          versions: {
            create: {
              versionNumber: newVersionNumber,
              body,
              createdByUserId: session.user.id,
            },
          },
        },
      })

      return { success: true, contentId }
    }
  } catch (error) {
    console.error('Save draft failed:', error)
    return { success: false, error: 'Failed to save' }
  }
}
```

### Pattern 4: Status-Based Workflow with State Machine

**What:** Content moves through states: Draft → Submitted → InReview → Approved/Rejected. Each state has allowed actions.

**When to use:** Model content lifecycle; prevent invalid transitions

**Database Schema (schema.prisma):**

```prisma
enum ContentStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
}

model Content {
  id              String @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  title           String
  status          ContentStatus @default(DRAFT)
  complianceScore Int?          // Latest compliance score (0-100)

  createdByUserId String
  createdBy       User @relation(fields: [createdByUserId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Versioning for audit trail
  versions        ContentVersion[]
  reviewDecision  ReviewDecision?

  @@unique([organizationId, id])
  @@index([organizationId])
  @@index([status])
  @@index([createdByUserId])
  @@map("content")
}

model ContentVersion {
  id              String @id @default(cuid())
  contentId       String
  content         Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  versionNumber   Int
  title           String
  body            String @db.Text
  topic           String
  audience        String
  tone            String
  complianceScore Int

  createdByUserId String
  createdBy       User @relation(fields: [createdByUserId], references: [id])
  createdAt       DateTime @default(now())

  @@unique([contentId, versionNumber])
  @@index([contentId])
  @@index([createdByUserId])
  @@map("content_versions")
}

model ReviewDecision {
  id              String @id @default(cuid())
  contentId       String @unique
  content         Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  decision        String // APPROVED or REJECTED
  reviewedByUserId String
  reviewedBy      User @relation(fields: [reviewedByUserId], references: [id])
  reason          String? // For rejections
  createdAt       DateTime @default(now())

  @@index([contentId])
  @@index([reviewedByUserId])
  @@map("review_decisions")
}
```

**Status Transition Logic:**

```typescript
// src/lib/content/types.ts
export type ContentStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'

export const statusTransitions: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['SUBMITTED'], // Draft can be submitted or stay draft
  SUBMITTED: ['IN_REVIEW'], // Reviewer moves to in_review
  IN_REVIEW: ['APPROVED', 'REJECTED'], // Reviewer approves or rejects
  APPROVED: [], // Terminal state
  REJECTED: ['DRAFT'], // Can return to draft to re-edit
}

export function canTransitionTo(currentStatus: ContentStatus, newStatus: ContentStatus): boolean {
  return statusTransitions[currentStatus].includes(newStatus)
}
```

### Pattern 5: Immutable Content Versioning for Audit

**What:** Every save creates a new version record (never update existing). Combined with audit logging, provides complete edit history.

**When to use:** Healthcare compliance requires tracking all changes

**Example:**

```typescript
// src/lib/actions/content.ts

export async function submitContentAction({
  contentId,
}: {
  contentId: string
}) {
  const session = await auth()
  const headersList = headers()
  const organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id || !organizationId) {
    throw new Error('Unauthorized')
  }

  const content = await db.content.findUnique({
    where: { id: contentId, organizationId },
  })

  if (!content || content.status !== 'DRAFT') {
    return { success: false, error: 'Can only submit draft content' }
  }

  // Validate governance before submission
  const violations = await validateContent(content.latestVersion.body)
  const score = calculateComplianceScore(violations)

  // Update status + store compliance score on version
  await db.content.update({
    where: { id: contentId },
    data: {
      status: 'SUBMITTED',
      complianceScore: score.score,
    },
  })

  // Audit log created automatically via Prisma middleware
  return { success: true, complianceScore: score.score }
}
```

### Anti-Patterns to Avoid

- **Updating existing version records:** Creates confusion about which version is "real." Instead, always create new versions with incrementing version numbers.
- **Real-time validation on every keystroke without debounce:** Overwhelms server; shows error states too frequently. Always debounce (300-500ms) before calling validation API.
- **No optimistic UI for saves:** Users see lag; feels slow. Always show "saving" → "saved" state immediately using useOptimistic.
- **Storing form data in state without drafts:** User navigates away, loses work. Always auto-save drafts to database.
- **Showing all validation errors at once:** Overwhelming UX. Group errors by category (governance violations, metadata errors) and show severity hierarchy.
- **No validation feedback in UI:** User submits content only to see it fails compliance. Always show real-time feedback as they type.
- **Client-side validation only:** User can bypass via network inspect. Always re-validate server-side before final submission.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom useState for each field | React Hook Form | RHF handles error states, validation, re-renders efficiently; custom approach gets complicated fast with validation chains |
| Client/server validation | Manual re-validation | Zod schema with zodResolver on client + validateForm on server | Zod enables shared schema preventing validation mismatches; manual validation duplicates logic |
| Real-time validation API calls | Bare fetch or infinite requests | Debounce with useEffect + setTimeout | Debouncing prevents request storms (100+ requests/min). Building debounce wrong causes race conditions |
| Auto-save detection | Manual dirty flag tracking | React Hook Form's formState.isDirty | RHF provides built-in dirty tracking; manual approach misses edge cases |
| Optimistic UI for saves | Manual state flipping | useOptimistic hook | useOptimistic handles rollback on failure; manual approach loses data if network fails between state update and server response |
| Content versioning | Updating single content record | Immutable versions with version numbers | Updates lose history. Versions enable audit trail, enable rollback, comply with healthcare regulations |
| Status workflow | If/else statements | Enum + state machine pattern | Enum prevents invalid states at database level; if/else scattered in code allows bugs |

**Key insight:** These patterns exist because they were discovered the hard way through production failures. Form validation race conditions, data loss from missing debounce, corrupted versioning from in-place updates—all have solutions in the standard library or established patterns.

## Common Pitfalls

### Pitfall 1: Debounce Timer Not Cleared on Unmount

**What goes wrong:** Component unmounts (user navigates away) while debounce timer is pending. Timer fires, making a server request for a component that no longer exists. Memory leak or orphaned request that confuses state.

**Why it happens:** useEffect debounce implemented without cleanup function.

**How to avoid:**

```typescript
const debounceRef = useRef<NodeJS.Timeout>()

useEffect(() => {
  // Clear previous timer
  if (debounceRef.current) clearTimeout(debounceRef.current)

  debounceRef.current = setTimeout(() => {
    // API call
  }, 300)

  // Cleanup on unmount
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }
}, [value])
```

**Warning signs:** Console errors about state updates on unmounted components; requests logging in server with no corresponding UI response; memory usage grows over time.

### Pitfall 2: Validation Violations Accumulate, Never Clear

**What goes wrong:** User types content with violations, violations show up. User fixes them, but violations list doesn't update. User sees stale errors even though content now complies.

**Why it happens:** Validation results cached or not invalidated when content changes.

**How to avoid:**

- Set violations state when validation completes, replacing previous list
- Don't merge or append violations; always replace with latest result
- Re-validate after every significant content change (debounced)

```typescript
// Good: Replace violations on each validation
const [violations, setViolations] = useState<Violation[]>([])

useEffect(() => {
  const timer = setTimeout(async () => {
    const result = await validateGovernanceAction(content)
    // Replace, don't merge
    setViolations(result.violations || [])
  }, 300)

  return () => clearTimeout(timer)
}, [content])

// Bad: Appending violations
violations.push(...newViolations) // Don't do this
```

**Warning signs:** Users report violations that they've already fixed still showing; violation count keeps growing even as content improves; UI shows 10 violations but user only sees 3 in content.

### Pitfall 3: Auto-Save Causes Infinite Version Creation

**What goes wrong:** Every auto-save creates a new version record. After 5 minutes of editing, you have 100+ versions. Database grows rapidly; version history becomes noise.

**Why it happens:** Auto-saving without checking if content actually changed.

**How to avoid:**

- Track content hash; only create version if hash changed
- Compare new body to last version's body; skip save if identical
- Debounce to 1+ second so rapid typing doesn't create versions

```typescript
// Good: Check if content actually changed before versioning
const lastVersion = await db.contentVersion.findFirst({
  where: { contentId },
  orderBy: { versionNumber: 'desc' },
})

if (lastVersion?.body === newBody) {
  // No changes, don't create version
  return { success: true, skipped: true }
}

// Content changed, create version
await db.contentVersion.create({
  data: { contentId, body: newBody, versionNumber: lastVersion.versionNumber + 1 },
})
```

**Warning signs:** Version counts grow to 100+ for single content; versioning causes slow queries; database size unexpectedly large for small amount of content.

### Pitfall 4: Form Validation Mode Causes Premature Errors

**What goes wrong:** Form set to `mode: 'onBlur'` or `mode: 'onChange'`. User clicks a field, types 1 character, gets error "must be at least 5 characters." Feels punishing.

**Why it happens:** Aggressive validation mode chosen without considering UX.

**How to avoid:**

- Use `mode: 'onBlur'` for initial validation (field loses focus, check then)
- Use `mode: 'onChange'` only after first blur (so user has a chance to type)
- Use `reValidateMode: 'onChange'` (re-validate after fix is made, remove error immediately)

```typescript
// Best practice for content editor
const form = useForm<ContentFormData>({
  resolver: zodResolver(contentFormSchema),
  mode: 'onBlur', // Validate when field loses focus
  reValidateMode: 'onChange', // Re-validate as user fixes error
})
```

**Warning signs:** User complaints about too many error messages while typing; high form abandonment rate; support tickets about validation being "too strict."

### Pitfall 5: Real-Time Validation Overwhelms API

**What goes wrong:** Every keystroke triggers validation API call. For 500-character body, that's potentially 500+ API calls. Server load spikes; validation responses slow down.

**Why it happens:** No debounce on validation; every onChange event fires immediately.

**How to avoid:**

- Always debounce validation calls (300-500ms minimum)
- For large content bodies (>1000 chars), use 500-1000ms debounce
- Consider server-side caching of validation results by content hash (1-minute TTL)

```typescript
// Good: Debounce prevents request storm
useEffect(() => {
  const timer = setTimeout(async () => {
    // Only fires once after user stops typing for 300ms
    const result = await validateGovernanceAction(content)
  }, 300)

  return () => clearTimeout(timer)
}, [content])

// Bad: No debounce, fires 500 times while typing 500 chars
const handleChange = async (value: string) => {
  const result = await validateGovernanceAction(value) // Called on every keystroke
}
```

**Warning signs:** Server logs show validation requests > 100x/second; API response times increase during content editing; database query logs show repeated identical queries.

### Pitfall 6: Status Transitions Not Enforced

**What goes wrong:** Content in APPROVED state gets reset to DRAFT via API call (no validation). Breaks the intent that approved content shouldn't be edited.

**Why it happens:** Status transition logic only in UI; not enforced at API level.

**How to avoid:**

- Enforce status machine in server action / API route
- Check `canTransitionTo()` before updating status
- Return error if transition not allowed

```typescript
// Good: Server-side enforcement
export async function updateContentStatusAction({
  contentId,
  newStatus,
}: {
  contentId: string
  newStatus: ContentStatus
}) {
  const content = await db.content.findUnique({
    where: { id: contentId },
  })

  // Validate transition
  if (!canTransitionTo(content.status, newStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${content.status} to ${newStatus}`,
    }
  }

  // Proceed with update
  return db.content.update({
    where: { id: contentId },
    data: { status: newStatus },
  })
}

// Bad: No validation, status can be set to anything
export async function updateContentStatusAction({
  contentId,
  newStatus,
}: {
  contentId: string
  newStatus: string // No type checking
}) {
  return db.content.update({
    where: { id: contentId },
    data: { status: newStatus }, // Allows invalid transitions
  })
}
```

**Warning signs:** Content states don't make logical sense (APPROVED → DRAFT); users can edit "approved" content; audit trail shows impossible state transitions.

### Pitfall 7: Race Condition: Validation vs Save

**What goes wrong:** User starts typing, governance validation API is called. Before response comes back, user clicks Save. Save completes, creates version. Then validation response arrives and shows violations for a version that already exists.

**Why it happens:** No coordination between validation call and save action; racing requests.

**How to avoid:**

- Don't block save on validation (validation is advisory, not blocking)
- Show violations to user; let them decide to save anyway
- Store compliance score with version at save time (not from async validation)
- Re-validate content at submit time (before moving to SUBMITTED state)

```typescript
// Good: Save creates version with compliance score from that moment
export async function saveDraftAction({ contentId, body }: { contentId?: string; body: string }) {
  // Run governance validation
  const violations = await validateContent(body)
  const score = calculateComplianceScore(violations)

  // Save version with score captured at this moment
  await db.contentVersion.create({
    data: {
      contentId,
      body,
      complianceScore: score.score, // Score is snapshot of this version
    },
  })
}

// Bad: Separate validation call, race condition
export async function saveDraftAction({ contentId, body }: { contentId?: string; body: string }) {
  // Save without score
  await db.content.update({
    where: { id: contentId },
    data: { body }, // No score captured
  })

  // Separate validation call (may race with other requests)
  const result = await validateGovernanceAction(body)
  // If another request modifies content between here and last line, score is wrong
}
```

**Warning signs:** Compliance scores don't match violations shown; users see violations but version has empty complianceScore; audit logs show version created, then validation result added later.

## Code Examples

Verified patterns from official sources and production implementations:

### Complete Content Editor with All Patterns

```typescript
// src/app/dashboard/[organizationId]/content/create/page.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useOptimistic, useEffect, useRef, useState } from 'react'
import { contentFormSchema, type ContentFormData } from '@/lib/validators/content-schema'
import { saveDraftAction, submitContentAction } from '@/lib/actions/content'
import { validateGovernanceAction } from '@/lib/actions/validation'
import type { Violation } from '@/lib/governance/validators/composite'

export default function CreateContentPage() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [validationLoading, setValidationLoading] = useState(false)
  const [saveState, setOptimisticSaveState] = useOptimistic<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()

  const {
    register,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    mode: 'onBlur', // Validate on blur, not on every keystroke
    reValidateMode: 'onChange', // Once field is touched and has error, revalidate as they fix
  })

  const bodyValue = watch('body')

  // Debounced governance validation
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setValidationLoading(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await validateGovernanceAction(bodyValue)
        setViolations(result.violations || [])
      } catch (error) {
        console.error('Validation error:', error)
      } finally {
        setValidationLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [bodyValue])

  // Debounced auto-save
  useEffect(() => {
    if (!bodyValue) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    setOptimisticSaveState('saving')

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const result = await saveDraftAction({ body: bodyValue })
        if (result.success) {
          setOptimisticSaveState('saved')
          setTimeout(() => setOptimisticSaveState('idle'), 2000)
        } else {
          setOptimisticSaveState('error')
        }
      } catch (error) {
        console.error('Save error:', error)
        setOptimisticSaveState('error')
      }
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [bodyValue])

  const onSubmit = async (data: ContentFormData) => {
    // Submit for review (triggers final validation at server)
    const result = await submitContentAction({ contentId: 'draft-id', formData: data })
    if (result.success) {
      // Navigate to content view
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
      <div>
        <label htmlFor="title">Title</label>
        <input
          {...register('title')}
          id="title"
          className={errors.title ? 'border-red-500' : 'border-gray-300'}
          placeholder="Enter content title"
        />
        {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
      </div>

      <div>
        <label htmlFor="body">Content Body</label>
        <textarea
          {...register('body')}
          id="body"
          rows={10}
          className={errors.body ? 'border-red-500' : 'border-gray-300'}
          placeholder="Write your content here..."
        />
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{bodyValue?.length || 0} / 50000 characters</span>
          <SaveStatusIndicator state={saveState} />
        </div>
        {errors.body && <span className="text-red-500 text-sm">{errors.body.message}</span>}
      </div>

      {/* Real-time governance feedback */}
      {violations.length > 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            {violations.length} Policy Violation{violations.length !== 1 ? 's' : ''}
          </h3>
          <ul className="space-y-2">
            {violations.map((v) => (
              <li key={`${v.policyId}-${v.startIndex}`} className="text-sm text-yellow-800">
                <strong>{v.policyId}:</strong> {v.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="topic">Topic</label>
        <select {...register('topic')} id="topic" className="border border-gray-300 p-2 w-full rounded">
          <option value="mental-health">Mental Health</option>
          <option value="substance-use">Substance Use</option>
          <option value="wellness">Wellness</option>
          <option value="crisis">Crisis Support</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="audience">Target Audience</label>
        <select {...register('audience')} id="audience" className="border border-gray-300 p-2 w-full rounded">
          <option value="patients">Patients</option>
          <option value="families">Families</option>
          <option value="professionals">Professionals</option>
          <option value="general">General Public</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="tone">Tone</label>
        <select {...register('tone')} id="tone" className="border border-gray-300 p-2 w-full rounded">
          <option value="informative">Informative</option>
          <option value="supportive">Supportive</option>
          <option value="clinical">Clinical</option>
          <option value="motivational">Motivational</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        disabled={violations.length > 0} // Disable submit if violations exist
      >
        Submit for Review
      </button>
    </form>
  )
}

function SaveStatusIndicator({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'idle') return null
  if (state === 'saving') return <span className="text-blue-600">Saving...</span>
  if (state === 'saved') return <span className="text-green-600">Saved</span>
  if (state === 'error') return <span className="text-red-600">Save failed</span>
}
```

### Content List with Status Dashboard

```typescript
// src/app/dashboard/[organizationId]/content/list/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db/client'
import type { Content, ContentStatus } from '@/lib/content/types'

export default function ContentListPage() {
  const [contents, setContents] = useState<Content[]>([])

  useEffect(() => {
    async function fetchContents() {
      // In real code, use server action or API route
      const data = await db.content.findMany({
        orderBy: { createdAt: 'desc' },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      })
      setContents(data)
    }

    fetchContents()
  }, [])

  const getStatusBadgeColor = (status: ContentStatus) => {
    const colors: Record<ContentStatus, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      SUBMITTED: 'bg-blue-200 text-blue-800',
      IN_REVIEW: 'bg-yellow-200 text-yellow-800',
      APPROVED: 'bg-green-200 text-green-800',
      REJECTED: 'bg-red-200 text-red-800',
    }
    return colors[status]
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Dashboard</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-center">Compliance Score</th>
              <th className="border p-2 text-left">Last Modified</th>
              <th className="border p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((content) => (
              <tr key={content.id} className="hover:bg-gray-50">
                <td className="border p-2 font-medium">{content.title}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadgeColor(content.status)}`}>
                    {content.status}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {content.complianceScore !== null ? `${content.complianceScore}/100` : '—'}
                </td>
                <td className="border p-2 text-sm text-gray-600">
                  {new Date(content.updatedAt).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <a
                    href={`/dashboard/content/${content.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    {content.status === 'DRAFT' ? 'Edit' : 'View'}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## State of the Art

Current approaches to content creation and real-time editing (2025-2026):

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Form libraries with manual error handling | React Hook Form + Zod with declarative schemas | 2022-2023 | Type-safe validation; less boilerplate; automatic error state management |
| Manual debouncing with lodash | useEffect with setTimeout/clearTimeout + cleanup | 2023+ | More explicit control; better with React's lifecycle; no external dependency |
| Separate validation on submit | Real-time validation with debounce while editing | 2023-2024 | Catches errors earlier; better UX; preventative vs reactive |
| Manual optimistic state updates | useOptimistic hook (React 19) | 2024-2025 | Built-in rollback on failure; less boilerplate; better coordination with server actions |
| Form data in browser only | Auto-save to drafts in database | 2023+ | No data loss; can resume from any device; audit trail of edits |
| Single content record with updates | Immutable version history | 2023-2024 | Enables audit trail, rollback, healthcare compliance; append-only vs in-place updates |
| Ad-hoc status tracking | State machine with enums | 2023-2024 | Type-safe state transitions; prevents invalid states; self-documenting |

**Deprecated/outdated:**
- **Formik:** Older form library; RHF is now standard. Formik still works but has more boilerplate.
- **Manual debouncing with variables:** `let debounceId = setTimeout(...)` without cleanup causes memory leaks and lost timer references. Always use useRef or useEffect cleanup.
- **Form validation on submit only:** Delays error feedback. Current standard is real-time validation with debounce.
- **Client-side validation only:** Insecure; server must re-validate. Standard is dual validation (client for UX, server for security).
- **Updating versions in place:** `UPDATE content SET body = ... WHERE id = x` loses history. Standard is immutable versions.

## Open Questions

Gaps that couldn't be fully resolved through available sources:

1. **Optimal debounce duration for large content (>10,000 characters)**
   - What we know: 300-500ms is standard for form inputs; larger content may need longer to avoid request storm
   - What's unclear: Does document size affect optimal debounce? Should governance validation debounce differ from auto-save debounce?
   - Recommendation: Start with 300ms for validation (advisory), 1000ms for auto-save (creates version). Monitor API load during Phase 3 implementation; adjust based on actual usage patterns.

2. **Compliance score threshold for allowing submission**
   - What we know: Phase 2 defines scoring (0-100). Phase 3 must decide: can user submit content with violations?
   - What's unclear: Should we block submission at <70 score? Allow submission with warning? Always allow?
   - Recommendation: Allow submission regardless of score (violations are advisory, not blocking). User submits → content moves to IN_REVIEW → reviewer approves/rejects based on full context. Violations are guidance, not gates.

3. **Version retention policy for drafts**
   - What we know: Phase 1 requires 7-year audit retention for final content. Drafts are not final.
   - What's unclear: How long to keep draft versions? After content is approved, can we delete old draft versions?
   - Recommendation: Keep all versions for 30 days after content leaves DRAFT status, then archive. Enables dispute resolution without bloating database.

4. **Concurrent editing: Can multiple users edit same draft?**
   - What we know: This phase is single-user (creator) editing. No mention of collaborative editing.
   - What's unclear: Should we lock drafts (creator exclusive) or allow simultaneous editing with conflict resolution?
   - Recommendation: For MVP, enforce exclusive lock: if User A opens draft, User B cannot edit until A closes. Document as limitation for Phase 4 (multi-user collaboration).

5. **Metadata validation: Real-time or submit-time?**
   - What we know: Metadata (topic, audience, tone) must be captured. Phase 2 governance assumes it's present.
   - What's unclear: Should we validate metadata choices in real-time, or only at submit?
   - Recommendation: Validate metadata on blur (after selection), not on every change. Metadata choices are small set; not advisory like governance violations.

## Sources

### Primary (HIGH confidence)

- **React Hook Form Official Docs:** https://react-hook-form.com/docs/useform
  - useForm hook API, validation modes (onBlur, onChange, onSubmit), formState object

- **Next.js 14 Server Actions:** https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations
  - Server action patterns, form handling with server actions, error handling

- **React useOptimistic Documentation:** https://react.dev/reference/react/useOptimistic
  - Optimistic UI pattern, concurrent rendering, rollback on failure

- **Zod TypeScript Schema Validation:** https://zod.dev
  - Schema definition, type inference, integration with React Hook Form via zodResolver

- **Prisma Multi-Tenant Patterns:** https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
  - Version management with Prisma, immutable records, audit logging via Client Extensions

- **PostgreSQL Enum Types:** https://www.postgresql.org/docs/current/datatype-enum.html
  - Enum definition, constraint enforcement at database level

### Secondary (MEDIUM confidence)

- [How to Build a Collaborative Editor with Next.js and Liveblocks](https://dev.to/sachinchaurasiya/how-to-build-a-collaborative-editor-with-nextjs-and-liveblocks-389m) — Real-time editor patterns; though MVP is single-user, patterns applicable for future multi-user work

- [A Complete Guide To Live Validation UX — Smashing Magazine](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/) — Real-time validation UX best practices, debouncing, error presentation

- [Optimistic UI Pattern with useOptimistic Hook](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) — Practical implementation guide for optimistic updates

- [WebSearch: Debouncing Patterns for React 2026](https://dev.to/alex_aslam/tackling-asynchronous-bugs-in-javascript-race-conditions-and-unresolved-promises-7jo) — Race condition prevention, debounce cleanup, common pitfalls

- [Type-Safe Form Validation in Next.js 15: Zod, RHF, & Server Actions](https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form) — Current best practices combining all three libraries

- [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a) — Version-based audit trails, immutable records

### Tertiary (LOW confidence, flagged for validation)

- [Design Patterns for Draft Management (2026)](https://medium.com/@qsstechnosoft01/10-ai-driven-ux-patterns-that-will-dominate-every-app-by-2026-95aadc88a5ea) — Auto-save patterns in 2026 context; general UX trends

- [Error Feedback UX Best Practices](https://www.nngroup.com/articles/errors-forms-design-guidelines/) — Guidelines for error message presentation; not healthcare-specific

- [State Machine Pattern for Approval Workflows](https://medium.com/@wacsk19921002/simplifying-approval-process-with-state-machine-a-practical-guide-part-1-modeling-26d8999002b0) — State machine modeling; general pattern, not specific to healthcare

## Metadata

**Confidence breakdown:**
- **Standard Stack (Form & Validation):** HIGH - React Hook Form + Zod verified against 2026 Next.js patterns; production-standard with extensive docs and community adoption
- **Debouncing & Real-Time Patterns:** MEDIUM-HIGH - Patterns verified via Next.js docs and established in ecosystem; some edge cases (optimal debounce timing, large content) require validation
- **Draft Management & Versioning:** MEDIUM - Patterns established (Prisma versioning, immutable records); healthcare-specific retention requirements need confirmation
- **Status Workflow:** MEDIUM - State machine pattern is standard; specific state transitions for content approval in healthcare may differ

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (form libraries and debounce patterns are stable; validation UX trends worth revisiting in 30 days)

**Known gaps requiring validation before implementation:**
1. Optimal debounce duration for governance validation vs auto-save (test during Phase 3 planning)
2. Compliance score blocking vs advisory (confirm with product/compliance team)
3. Draft version retention policy after approval (decide with data retention policy)
4. Concurrent editing scope (confirm MVP is single-user only)
5. Metadata validation timing (decide during Phase 3 planning)

**Next validation points:**
- After Phase 3 planning: Confirm debounce durations, compliance score handling, metadata validation approach
- After first implementation: Measure actual API load during content editing; adjust debounce if needed
- Before Phase 4 (multi-user collaboration): Revisit real-time editor patterns (Yjs, CRDTs, Liveblocks)
