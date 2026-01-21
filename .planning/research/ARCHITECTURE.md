# Architecture Patterns: Multi-Tenant SaaS with Governance

**Project:** Marketing OS (Multi-tenant SaaS with Healthcare Compliance)
**Researched:** 2026-01-21
**Focus:** Organization → Client → Resources multi-tenancy with real-time governance

---

## Executive Summary

Multi-tenant SaaS with governance requires a layered isolation strategy: tenant context flows through middleware (Next.js), application layer validates permissions (tRPC), domain layer enforces business rules (Prisma + policy engine), and data layer applies row-level security (PostgreSQL with RLS).

The critical architectural insight: **governance validation happens at three points** — presentation/form validation (UX), application layer (tRPC procedures), and domain layer (business rules). For healthcare compliance and real-time approval workflows, domain-layer validation is mandatory.

**Key architectural pattern for your project:**
- **Multi-tenancy model:** Pool model (shared database, logical tenant ID isolation)
- **Governance engine:** Real-time policy validation at application/domain boundary
- **Approval workflow:** Event-driven routing to role-based reviewers
- **Data isolation:** Row-level security + tenant ID enforcement across all queries
- **Audit trail:** Event sourcing for every governance decision

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  (Next.js Client + Server Components, tRPC routes)             │
│  - Form validation (early feedback)                             │
│  - Tenant context from middleware                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (tRPC routers)                   │
│  - Tenant ID extraction from request context                    │
│  - Permission checks against role-based rules                   │
│  - Request transformation & validation                          │
│  - Event emission for audit trail                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            GOVERNANCE ENGINE (Policy Validation)                │
│  - Real-time policy evaluation                                  │
│  - Approval workflow orchestration                              │
│  - Role-based routing (clinical → marketing → legal)            │
│  - Content compliance checking                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            DOMAIN LAYER (Business Logic)                        │
│  - Campaign/Content/Client entity rules                         │
│  - Workflow state management                                    │
│  - Approval decision enforcement                                │
│  - n8n execution trigger logic                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│       DATA PERSISTENCE LAYER (Prisma + PostgreSQL)              │
│  - Row-level security enforcement                               │
│  - Tenant ID filtering on all queries                           │
│  - Event log table (immutable audit trail)                      │
│  - Reference data (policies, roles, approval templates)         │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         EXTERNAL EXECUTORS & SERVICES                           │
│  - n8n (image/video generation workflows)                       │
│  - Email/notification service                                   │
│  - AI/LLM provider (content generation)                         │
│  - Compliance logging service                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries & Responsibilities

### 1. Tenant Context & Middleware Layer

**Responsibility:** Establish tenant identity from request and make available throughout request lifecycle.

**Components:**
- Next.js middleware (extracts tenant from subdomain, path, or custom domain)
- tRPC context builder (enriches context with tenant ID, user, organization)
- Request/response handlers (inject tenant context)

**Key decisions:**
- **Tenant identification:** For Marketing OS, use organization ID from URL subdomain or path: `/org-{id}/*`
- **Tenant propagation:** Store `tenantId` and `organizationId` in tRPC context, never pass as URL parameters alone
- **Session binding:** User session must include organization_id; validate on every request

**Data flow:**
```
Request → Middleware extracts subdomain/path
        → Looks up organization from domain mapping table
        → Validates user has access to organization
        → Injects {organizationId, userId, userRoles} into tRPC context
        → Context available in all tRPC procedures
```

**Code pattern (Next.js):**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const subdomain = hostname.split('.')[0]

  if (subdomain && subdomain !== 'www') {
    // Route to organization
    return NextResponse.rewrite(
      new URL(`/${subdomain}${request.nextUrl.pathname}`, request.url)
    )
  }
}

// trpc/init.ts
export const createTRPCContext = async (opts: {
  headers: Headers
  session?: Session
}) => {
  const organizationId = opts.headers.get('x-org-id') // from middleware
  const userId = opts.session?.user?.id

  return {
    organizationId,
    userId,
    db: prisma,
  }
}
```

### 2. Application Layer (tRPC Routers)

**Responsibility:** Handle request validation, permission checks, and workflow orchestration.

**Components:**
- Procedure middleware (RBAC enforcement)
- Input validation schemas (tRPC validators)
- Service functions (orchestrate domain logic)
- Event emitters (audit trail)

**Key patterns:**
- Every procedure takes `ctx.organizationId` and validates user has access
- Procedures are organized by entity and responsibility
- Permission checks happen before domain logic execution
- All state changes emit events to audit table

**RBAC hierarchy for Marketing OS:**
```
Organization
  ├─ Admin (all permissions)
  ├─ Marketing Lead (create campaigns, can approve marketing content)
  ├─ Clinical Reviewer (approve clinical/safety content)
  └─ Content Contributor (create content, view feedback)

Client
  ├─ Admin (manage client settings)
  ├─ Campaign Manager (create/edit campaigns)
  └─ Viewer (read-only access)
```

**Code pattern (tRPC with middleware):**
```typescript
// trpc/routers/_app.ts
const publicProcedure = t.procedure
const protectedProcedure = t.procedure
  .use(async (opts) => {
    if (!opts.ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return opts.next()
  })

const organizationProcedure = protectedProcedure
  .use(async (opts) => {
    if (!opts.ctx.organizationId) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return opts.next()
  })

// trpc/routers/campaign.ts
export const campaignRouter = t.router({
  create: organizationProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      const canCreate = await hasPermission(
        ctx.userId,
        ctx.organizationId,
        'campaign:create'
      )
      if (!canCreate) throw new TRPCError({ code: 'FORBIDDEN' })

      // Create campaign
      const campaign = await ctx.db.campaign.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
          createdBy: ctx.userId,
        },
      })

      // Emit event
      await ctx.db.auditLog.create({
        data: {
          organizationId: ctx.organizationId,
          action: 'campaign_created',
          entityType: 'Campaign',
          entityId: campaign.id,
          userId: ctx.userId,
          changes: campaign,
        },
      })

      return campaign
    }),
})
```

### 3. Governance Engine (Policy Validation)

**Responsibility:** Real-time policy validation, approval workflow routing, and compliance checking.

**Components:**
- Policy evaluator (evaluate content against rules)
- Approval workflow engine (route to appropriate reviewers)
- Compliance validator (healthcare-specific rules)
- Webhook executor (trigger n8n workflows)

**Key patterns:**
- Policies stored in database as versioned rules
- Real-time evaluation when content is created/modified
- Approval routing determined by content type and organization settings
- n8n integration triggered by policy decisions

**Approval workflow for content in healthcare context:**

```
Content Created
  │
  ├─→ Governance Engine evaluates:
  │     - Clinical safety (requires clinical review?)
  │     - Regulatory compliance (requires legal review?)
  │     - Brand alignment (requires marketing review?)
  │
  ├─→ If needs review:
  │     - Create Approval task
  │     - Determine required reviewers by role
  │     - Send notifications to role group
  │     - Set status to "pending_review"
  │
  ├─→ If no review needed:
  │     - Trigger media generation (n8n webhook)
  │     - Set status to "generating"
  │     - Emit content_approved event
  │
  └─→ On approval received:
      - Trigger n8n if not already running
      - Update content status
      - Emit decision_recorded event
```

**Code pattern (governance engine):**
```typescript
// lib/governance.ts
export async function evaluateContent(
  organizationId: string,
  content: ContentInput
): Promise<{
  requiresReview: boolean
  approvalRequired: 'clinical' | 'marketing' | 'legal' | null
  policies: string[] // which policies were triggered
}> {
  // Load organization governance rules
  const rules = await db.governanceRule.findMany({
    where: { organizationId, enabled: true },
  })

  const triggered = []
  let requiresReview = false
  let approvalRequired = null

  // Check each rule
  for (const rule of rules) {
    const matches = evaluateRule(rule, content)
    if (matches) {
      triggered.push(rule.id)
      if (rule.requiresApproval) {
        requiresReview = true
        approvalRequired = rule.requiredReviewRole
      }
    }
  }

  return {
    requiresReview,
    approvalRequired,
    policies: triggered,
  }
}

// In campaign content mutation:
const evaluation = await evaluateContent(ctx.organizationId, {
  title: input.title,
  description: input.description,
  targetAudience: input.targetAudience,
})

if (evaluation.requiresReview) {
  // Create approval workflow
  const workflow = await createApprovalWorkflow({
    organizationId: ctx.organizationId,
    contentId: campaign.id,
    requiredRole: evaluation.approvalRequired,
  })

  // Emit event
  await emitEvent('content_submitted_for_review', {
    workflowId: workflow.id,
    contentId: campaign.id,
  })
} else {
  // Directly trigger n8n
  await triggerN8nWorkflow('generate-media', {
    campaignId: campaign.id,
    contentId: content.id,
  })
}
```

### 4. Domain Layer (Business Logic)

**Responsibility:** Enforce invariants, manage state transitions, and coordinate n8n execution.

**Components:**
- Entity models (Campaign, Content, Client, Approval)
- State machines (content lifecycle, approval status)
- Business rules (what transitions are allowed, when)
- n8n service (webhook execution, error handling)

**Key patterns:**
- State transitions validated before database commit
- Only valid state changes allowed
- n8n execution tracked as part of domain state
- Compensation logic for failed executions

**Content lifecycle state machine:**
```
draft → submitted → [needs_review: approval_pending] → approved → generating → generated → published
  ↓         ↓              ↓                              ↓           ↓            ↓
[can edit] [locked]   [locked for edit]          [webhook sent]  [waiting]  [readonly]
```

**Code pattern (domain layer):**
```typescript
// domain/content.ts
export class ContentAggregate {
  constructor(
    public id: string,
    public campaignId: string,
    public organizationId: string,
    public status: ContentStatus,
    public governancePolicies: string[],
    public approvalWorkflowId: string | null,
    public generationJobId: string | null,
    private readonly events: DomainEvent[] = []
  ) {}

  async submit(userId: string): Promise<void> {
    if (this.status !== 'draft') {
      throw new InvalidStateTransition(
        `Cannot submit content in status: ${this.status}`
      )
    }

    this.status = 'submitted'
    this.recordEvent('ContentSubmitted', {
      userId,
      governancePolicies: this.governancePolicies,
    })
  }

  async approveAndGenerate(
    approverId: string,
    approvalWorkflowId: string
  ): Promise<string> {
    if (this.status !== 'approval_pending') {
      throw new InvalidStateTransition(
        `Cannot approve content in status: ${this.status}`
      )
    }

    this.status = 'approved'
    this.recordEvent('ContentApproved', {
      approverId,
      approvalWorkflowId,
    })

    // Trigger n8n job
    const jobId = await this.triggerN8nGeneration()
    this.generationJobId = jobId
    this.status = 'generating'

    this.recordEvent('GenerationStarted', { jobId })
    return jobId
  }

  private async triggerN8nGeneration(): Promise<string> {
    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        campaignId: this.campaignId,
        contentId: this.id,
        timestamp: new Date(),
      }),
    })

    if (!response.ok) {
      throw new N8nExecutionFailed(`n8n webhook failed: ${response.status}`)
    }

    const { jobId } = await response.json()
    return jobId
  }

  getDomainEvents(): DomainEvent[] {
    return this.events
  }

  private recordEvent(type: string, data: any): void {
    this.events.push({
      type,
      aggregateId: this.id,
      timestamp: new Date(),
      data,
    })
  }
}
```

### 5. Data Persistence Layer (Prisma + PostgreSQL)

**Responsibility:** Store all tenant data with row-level security and maintain audit trail.

**Components:**
- Schema with tenant isolation
- Row-level security (RLS) policies
- Audit log (immutable event store)
- Reference data (policies, roles, templates)

**Key patterns:**
- Every table with multi-tenant data includes `organizationId`
- All queries filtered by `organizationId` (via Prisma middleware)
- RLS enforced at database level as defense-in-depth
- Audit log stores immutable events for compliance

**Schema highlights:**

```prisma
// Multi-tenant data always includes organizationId
model Campaign {
  id            String   @id @default(cuid())
  organizationId String
  clientId      String

  title         String
  description   String
  status        ContentStatus

  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  organization  Organization @relation(fields: [organizationId], references: [id])
  client        Client @relation(fields: [clientId], references: [id])

  @@index([organizationId])
  @@index([clientId])
}

// Governance configuration per organization
model GovernanceRule {
  id            String   @id @default(cuid())
  organizationId String

  name          String
  description   String
  enabled       Boolean  @default(true)

  // Policy evaluation
  triggerCondition JsonValue // e.g., { "contentType": "clinical_claim" }
  requiresApproval Boolean
  requiredReviewRole String // 'clinical' | 'marketing' | 'legal'

  organization  Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, name])
  @@index([organizationId])
}

// Approval workflow management
model ApprovalWorkflow {
  id            String   @id @default(cuid())
  organizationId String
  contentId     String

  status        ApprovalStatus // pending, approved, rejected
  requiredRole  String
  assignedTo    String? // user ID if assigned to individual

  createdAt     DateTime @default(now())
  completedAt   DateTime?
  completedBy   String?
  decision      String? // approval reason/comments

  organization  Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([contentId])
  @@index([status])
}

// Immutable audit trail
model AuditLog {
  id            String   @id @default(cuid())
  organizationId String

  action        String // 'campaign_created', 'content_submitted', etc
  entityType    String // 'Campaign', 'Content', 'ApprovalWorkflow'
  entityId      String

  userId        String
  changes       Json // what changed (before/after)
  reason        String? // why (approval comment, etc)

  createdAt     DateTime @default(now())

  organization  Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([createdAt])
  @@index([entityType, entityId])
}

// Enforcement: Prisma middleware filters all queries
const prisma = new PrismaClient().$extends({
  query: {
    campaign: {
      async findMany({ args, query }) {
        if (!args.where) args.where = {}
        // CRITICAL: Always filter by organization
        args.where.organizationId = getCurrentOrganizationId()
        return query(args)
      },
    },
    // Apply to all multi-tenant models...
  },
})
```

### 6. Event-Driven Audit Trail

**Responsibility:** Record every governance decision and state change for compliance.

**Components:**
- Event emitter (create audit entries)
- Event store (AuditLog table)
- Event replayer (reconstruct history)
- Compliance reporter (export audit logs)

**Key patterns:**
- Every domain change creates an event
- Events are immutable (no updates, only inserts)
- Events include: actor, action, entity, changes, timestamp
- Events enable compliance reporting and forensics

**Critical events to capture:**
```
1. governance_rule_checked
   - Which policies were evaluated
   - Which policies triggered
   - Content being evaluated

2. approval_workflow_created
   - Which reviewer role is needed
   - Why (which policies triggered)

3. approval_decision_made
   - Approver ID
   - Approved or rejected
   - Decision reason/comments

4. content_approved
   - Will proceed to generation

5. n8n_execution_requested
   - Workflow name
   - Payload
   - Expected outputs

6. n8n_execution_completed
   - Status (success/failed)
   - Output URLs/references
   - Generation timestamps
```

**Code pattern (event emission):**
```typescript
// In application layer, after any state change
async function recordGovernanceEvent(
  organizationId: string,
  eventType: string,
  data: any
): Promise<void> {
  await db.auditLog.create({
    data: {
      organizationId,
      action: eventType,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      changes: data.details,
      reason: data.reason,
    },
  })
}

// Call after every decision
await recordGovernanceEvent(organizationId, 'approval_decision_made', {
  entityType: 'ApprovalWorkflow',
  entityId: workflow.id,
  userId: approverId,
  details: {
    decision: 'approved',
    timestamp: new Date(),
  },
  reason: 'Clinical safety verified',
})
```

---

## Data Flow: Content Creation → Approval → Generation

**Scenario:** Marketing coordinator creates a campaign with clinical claims.

```
1. USER SUBMITS CONTENT
   ├─ Form validation (Next.js form component)
   ├─ Empty fields rejected early
   └─ User sees immediate feedback

2. tRPC MUTATION CALLED
   ├─ Extract organizationId from context
   ├─ Validate user has 'campaign:create' permission
   ├─ Reject if organization not found or user not member

3. APPLICATION LAYER PROCESSING
   ├─ Input schema validation (tRPC input)
   ├─ Check if content has medical claims (keyword scan)
   ├─ Emit 'campaign_submitted' event

4. GOVERNANCE ENGINE EVALUATION
   ├─ Load organization's governance rules
   ├─ Evaluate against rule triggers:
   │   ├─ "Contains clinical claims" → requires clinical review
   │   ├─ "Uses regulated terms" → requires legal review
   │   └─ "Brand compliance" → requires marketing review
   ├─ Determine which roles need to approve
   ├─ Emit 'governance_rules_checked' event

5a. IF APPROVAL REQUIRED
   ├─ Create ApprovalWorkflow entry for each required role
   ├─ Status: approval_pending
   ├─ Emit 'approval_workflow_created' event
   ├─ Notify approvers (email via notification service)
   └─ Return to user: "Waiting for review"

5b. IF NO APPROVAL REQUIRED
   ├─ Trigger n8n webhook immediately
   ├─ Status: generating
   ├─ Emit 'content_approved' event
   └─ Return to user: "Generation in progress"

6. APPROVAL DECISION (when reviewer acts)
   ├─ Reviewer opens approval task
   ├─ Reviewer comments and decides
   ├─ Application receives approval decision via tRPC
   │
   ├─→ IF APPROVED:
   │   ├─ Trigger n8n webhook
   │   ├─ Status: generating
   │   ├─ Emit 'approval_decision_made' + 'n8n_execution_requested'
   │   └─ Notify original creator
   │
   └─→ IF REJECTED:
       ├─ Status: needs_revision
       ├─ Emit 'approval_decision_made'
       └─ Notify creator with feedback

7. N8N EXECUTION
   ├─ n8n webhook received
   ├─ Generate images/videos
   ├─ Store URLs in database
   ├─ POST callback to your app
   ├─ Status: generated
   ├─ Emit 'n8n_execution_completed' event
   └─ Notify stakeholders

8. AUDIT TRAIL
   ├─ All events stored in AuditLog
   ├─ Compliance team can query:
   │   - "Show all approvals for this campaign"
   │   - "Show all edits by this user"
   │   - "Show all rejections from this reviewer"
   └─ Enable HIPAA audit logging
```

---

## Multi-Tenancy Isolation Strategy

### Tenant Model Hierarchy

For Marketing OS, use a hierarchical isolation model:

```
Organization (top-level tenant)
  ├─ Client (within organization)
  │  ├─ Campaign
  │  │  └─ Content (media variants)
  │  └─ Collaborators (users from organization)
  ├─ Settings (governance rules, roles)
  ├─ Team Members (users with roles)
  └─ Audit Log (immutable compliance record)
```

**Isolation rules:**
- User can only see organizations they're a member of
- User can only see clients within their organization
- User can only see campaigns within their organization's clients
- Reviewer can only approve/reject within their organization

### Data Isolation Levels

**Level 1: Logical Isolation (Pool Model)**
```
All tenants → Single PostgreSQL database
            → Single table (campaigns, approvals, etc.)
            → organizationId column filters data

Advantages:
- Lowest cost and simplest deployment
- Automatic backups cover all orgs
- Easiest to scale to many tenants

Disadvantages:
- Query errors could expose other orgs' data
- Noisy neighbor (one org can affect others)
- Regulatory requirements may reject this
- Harder to implement data residency
```

**Level 2: Schema Isolation (Bridge Model)**
```
Org 1 → Schema: org_1 | Tables: campaigns, approvals...
Org 2 → Schema: org_2 | Tables: campaigns, approvals...
...
All in same PostgreSQL instance

Advantages:
- Better isolation than logical filtering
- Still relatively efficient
- Can support compliance requirements

Disadvantages:
- Complex schema migration story
- Still shares compute resources
```

**Level 3: Database Isolation (Silo Model)**
```
Org 1 → Database: org_1_db  | User: org_1_user
Org 2 → Database: org_2_db  | User: org_2_user
...

Advantages:
- Maximum isolation (HIPAA compliant)
- Can enforce different encryption per org
- No noisy neighbor problem

Disadvantages:
- Highest operational complexity (v1 solo dev → hard)
- Significantly higher costs
- Schema management across N databases
```

### Recommendation for Marketing OS v1

**Use Pool Model (logical isolation) with strict guardrails:**

1. **Middleware enforcement:** Every request must include organizationId
2. **Query enforcement:** All queries filtered by organizationId at Prisma middleware level
3. **RLS enforcement:** PostgreSQL RLS policies as defense-in-depth
4. **Audit enforcement:** All mutations recorded in AuditLog with organizationId
5. **Prepare for migration:** Design schema to support silo model if regulatory requirements change

**SQL Row-Level Security (backup safeguard):**

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their organization's campaigns
CREATE POLICY rls_campaigns_org_isolation ON campaigns
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Policy enforcement in queries
SET app.current_org_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT * FROM campaigns; -- Only returns this org's campaigns
```

**Why this works for v1:**
- Affordable (no extra database infrastructure)
- Deployable by solo developer
- Auditable (every change logged)
- Scalable to thousands of organizations
- Path to compliance-tier isolation when needed

---

## Where Governance Validation Happens

### Layer 1: Presentation Validation (Fast Feedback)

```typescript
// pages/campaigns/new.tsx - Early validation
const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().min(10, "Minimum 10 characters"),
  targetAudience: z.enum(['healthcare_professionals', 'patients', 'both']),
})

// User sees "Required" error before any backend call
// Prevents invalid requests from reaching application layer
```

**Purpose:** User experience, not security

### Layer 2: Application Layer Validation (Permission Check)

```typescript
// trpc/routers/campaign.ts - Authorization
export const campaignRouter = t.router({
  create: organizationProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      // CRITICAL VALIDATION
      const canCreate = await checkPermission(
        ctx.userId,
        ctx.organizationId,
        'campaign:create'
      )
      if (!canCreate) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Proceed with creation
    }),
})
```

**Purpose:** Security boundary, enforce access control

### Layer 3: Domain Layer Validation (Business Rules)

```typescript
// domain/content.ts - Business logic constraints
export class ContentAggregate {
  async submit(userId: string): Promise<void> {
    // Enforce state machine
    if (this.status !== 'draft') {
      throw new InvalidStateTransition(...)
    }

    // Check governance policies
    const policies = await evaluateGovernance(this)
    if (policies.requiresApproval && !this.hasApprovalPath()) {
      throw new GovernanceViolation(
        'This content type requires approval but no approvers assigned'
      )
    }

    // Only then allow state change
    this.status = 'submitted'
  }
}
```

**Purpose:** Enforce business invariants, governance policy rules

### Layer 4: Data Layer Validation (Last Defense)

```sql
-- PostgreSQL constraints prevent invalid states
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_valid_status
  CHECK (status IN ('draft', 'submitted', 'approved', 'generating', 'published'));

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_organization_required
  CHECK (organization_id IS NOT NULL);

-- RLS as final safeguard
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_campaigns ON campaigns
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

**Purpose:** Prevent data corruption if application layer fails

---

## Build Order & Dependencies

For a solo developer, implement in this order:

### Phase 1: Multi-Tenant Foundation (Week 1)
- Next.js middleware for tenant context extraction
- tRPC context with organizationId
- Basic authentication/authorization checks
- Prisma schema with organizationId on all tables
- AuditLog table

**Why first:** Everything depends on reliable tenant isolation. Get this rock-solid before adding complexity.

### Phase 2: Data Layer Isolation (Week 2)
- Prisma middleware to auto-filter by organizationId
- PostgreSQL RLS policies
- Test that queries return only org's data
- Backup guardrails in place

**Why second:** Prevent data leakage bugs early. Easier to test than later.

### Phase 3: Basic CRUD + Permissions (Week 3)
- Campaign CRUD operations
- Role-based permission checks (can user create campaigns?)
- Audit logging for all mutations
- Basic error handling

**Why third:** Core functionality, straightforward to test.

### Phase 4: Governance Engine (Week 4-5)
- Policy evaluation (hardcode first policies)
- ApprovalWorkflow creation logic
- Role-based routing to reviewers
- Approval decision mutations

**Why fourth:** Depends on Phase 3, core for compliance.

### Phase 5: n8n Integration (Week 6)
- n8n webhook structure
- Trigger n8n from content approval
- Track generation job status
- Handle callbacks from n8n

**Why fifth:** External system, less critical than internal workflow.

### Phase 6: Real-Time Notifications (Week 7)
- Email notifications for approvals
- Real-time UI updates (websocket/polling)
- Approval task UI for reviewers

**Why last:** Nice-to-have UX, not core to MVP.

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Next.js Middleware                                     │
│  ├─ Extract tenant from URL                            │
│  ├─ Validate user has access                          │
│  └─ Inject organizationId into context                │
│                 │                                       │
│                 ▼                                       │
│  tRPC Router (Application Layer)                       │
│  ├─ campaign.create (check permissions)               │
│  ├─ approval.decide (check reviewer role)             │
│  └─ emit audit events                                 │
│                 │                                       │
│                 ▼                                       │
│  Governance Engine                                      │
│  ├─ evaluateGovernance() → policies triggered?        │
│  ├─ createApprovalWorkflow() → route to reviewers     │
│  └─ triggerN8nWorkflow() → start generation           │
│                 │                                       │
│                 ▼                                       │
│  Domain Layer                                          │
│  ├─ ContentAggregate.submit()                         │
│  ├─ ApprovalWorkflow state machine                    │
│  └─ enforce invariants                                │
│                 │                                       │
│                 ▼                                       │
│  Data Layer (Prisma)                                   │
│  ├─ Middleware auto-filters by organizationId         │
│  ├─ Insert into campaigns, approvals, auditLog        │
│  └─ Enforce RLS at PostgreSQL                         │
│                                                         │
│  ↓ Events (async)                                      │
│                                                         │
│  n8n Webhook                                           │
│  ├─ POST /api/webhooks/n8n/media-generation           │
│  ├─ {campaignId, contentId, mediaUrls}               │
│  └─ Trigger callback mutation                         │
│                                                         │
│  Notification Service                                  │
│  ├─ Email approvers when workflow created            │
│  ├─ Email creator when approval made                 │
│  └─ Update UI with real-time status                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### At 100 Users
- Single PostgreSQL instance sufficient
- Shared n8n instance or cloud
- Basic monitoring (error logs)
- Manual backups acceptable

### At 10K Users / 1000 Organizations
- Monitor database query performance
- Add indices on common filters (organizationId, userId)
- Consider read replicas for reporting
- Implement connection pooling
- Monitor audit log growth (might archive old logs)

### At 100K+ Users / 10K+ Organizations
- **Evaluate silo model:** Separate database per organization may become necessary
  - HIPAA compliance may mandate this
  - Cost predictability better with isolated infrastructure
  - Operational complexity increases significantly

- **Event-driven archiving:** Move old audit logs to archive storage
  - Keep last 7 years in database for compliance
  - Archive older records to S3/cold storage

- **Governance engine caching:** Cache policy rules per organization
  - Reduce database lookups on every submission
  - Invalidate on rule changes

- **n8n scaling:** May need n8n enterprise or dedicated instance
  - Self-hosted n8n can handle significant volume
  - Consider load balancing if needed

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Unscoped Queries
**What goes wrong:** Developer forgets to filter by organizationId, returns all orgs' data

**Prevention:**
```typescript
// ❌ BAD: No organizationId filter
const campaigns = await db.campaign.findMany({
  where: { clientId: input.clientId }
})

// ✅ GOOD: Always include organizationId
const campaigns = await db.campaign.findMany({
  where: {
    organizationId: ctx.organizationId,
    clientId: input.clientId,
  }
})
```

### Anti-Pattern 2: Client-Side Enforced Isolation
**What goes wrong:** Trust user ID from client, skip server validation

**Prevention:**
```typescript
// ❌ BAD: Trust client to send correct orgId
const campaigns = await db.campaign.findMany({
  where: { organizationId: input.organizationId } // Client sends this!
})

// ✅ GOOD: Use organizationId from auth context
const campaigns = await db.campaign.findMany({
  where: { organizationId: ctx.organizationId } // From server session
})
```

### Anti-Pattern 3: Permission Checks After Data Fetch
**What goes wrong:** Check permissions after loading data, leaks existence

**Prevention:**
```typescript
// ❌ BAD: Check permission after query
const campaign = await db.campaign.findFirst({
  where: { id: input.id }
})
if (!canEdit(campaign)) throw new Error() // Leaks that campaign exists

// ✅ GOOD: Check permission before/during query
const canEdit = await checkPermission(ctx.userId, 'campaign:edit')
if (!canEdit) throw new TRPCError({ code: 'FORBIDDEN' })

const campaign = await db.campaign.findFirst({
  where: {
    id: input.id,
    organizationId: ctx.organizationId
  }
})
```

### Anti-Pattern 4: Governance Bypass
**What goes wrong:** Create content directly without governance evaluation

**Prevention:**
```typescript
// ❌ BAD: Skip governance check
const campaign = await db.campaign.create({
  data: { ...input, organizationId: ctx.organizationId }
})

// ✅ GOOD: Always evaluate governance
const evaluation = await evaluateGovernance(ctx.organizationId, input)
if (evaluation.requiresReview) {
  // Create approval workflow first
}
const campaign = await db.campaign.create({
  data: {
    ...input,
    organizationId: ctx.organizationId,
    governancePolicies: evaluation.policies
  }
})
```

### Anti-Pattern 5: Missing Audit Trail
**What goes wrong:** Changes made but not logged, no forensics for incidents

**Prevention:**
```typescript
// ❌ BAD: No audit logging
const campaign = await db.campaign.update({
  where: { id: input.id },
  data: input.updates,
})

// ✅ GOOD: Always emit event
const campaign = await db.campaign.update({
  where: { id: input.id },
  data: input.updates,
})

await db.auditLog.create({
  data: {
    organizationId: ctx.organizationId,
    action: 'campaign_updated',
    entityType: 'Campaign',
    entityId: campaign.id,
    userId: ctx.userId,
    changes: input.updates,
  }
})
```

---

## Healthcare Compliance Specific Patterns

### HIPAA Audit Logging Requirements

Every action on protected health information (PHI) must be logged:

```typescript
// PHI access must be audited
export async function createApprovalWorkflow(
  organizationId: string,
  contentId: string,
  reviewerRole: string,
  details: any
) {
  // Create workflow
  const workflow = await db.approvalWorkflow.create({
    data: { organizationId, contentId, reviewerRole }
  })

  // HIPAA requirement: Log access
  await db.auditLog.create({
    data: {
      organizationId,
      action: 'phi_accessed_for_review', // Explicit PHI access
      entityType: 'ApprovalWorkflow',
      entityId: workflow.id,
      userId: 'system', // Approval workflow creation
      details: { reviewerRole }, // What was accessed
    }
  })
}
```

### Data Encryption at Rest (HIPAA requirement)

PostgreSQL supports transparent encryption:

```sql
-- Enable encryption for sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted PHI
ALTER TABLE campaigns
  ADD COLUMN description_encrypted BYTEA;

-- Encrypt on insert
INSERT INTO campaigns (id, description_encrypted)
  VALUES (1, pgp_sym_encrypt(description, 'encryption_key'));

-- Decrypt on select
SELECT id, pgp_sym_decrypt(description_encrypted::bytea, 'encryption_key')::text
FROM campaigns
WHERE organization_id = '...';
```

### Breach Notification Tracking

```typescript
// Track potential breaches for 60-day notification requirement
model DataBreachEvent {
  id: String @id
  organizationId: String

  discoveredAt: DateTime
  firstAccessedAt: DateTime?

  affectedEntityType: String // "Campaign", "ApprovalWorkflow"
  affectedRecordCount: Int

  rootCause: String
  status: 'investigating' | 'notifying' | 'closed'

  notificationSentAt: DateTime?
  notificationDeadline: DateTime // Must notify by 60 days from discovery
}

// Check notification deadline approaching
const breachesNeedingNotification = await db.dataBreachEvent.findMany({
  where: {
    organizationId,
    status: 'investigating',
    notificationDeadline: {
      lte: addDays(new Date(), 7) // Within 7 days
    }
  }
})
```

---

## Technology Stack Alignment

This architecture works well with your chosen stack:

- **Next.js 14:** Middleware for tenant context, Server Components for data fetching
- **tRPC:** Type-safe procedures with context-aware permissions
- **Prisma:** ORM with middleware support for auto-filtering
- **PostgreSQL:** Native RLS, strong ACID guarantees for audit trail
- **n8n:** Webhook-driven execution, managed as external service

**Deployment topology:**
```
Vercel (Next.js app + API routes)
  ├─ tRPC endpoints
  ├─ n8n callback webhooks
  └─ Middleware for tenant extraction

PostgreSQL (managed: Railway, Neon, or self-hosted)
  ├─ Multi-tenant schema
  ├─ RLS policies
  └─ Audit trail (AuditLog table)

n8n (self-hosted or cloud)
  ├─ Media generation workflows
  └─ Triggered by approval workflow

Email Service (SendGrid, Resend, etc.)
  └─ Approval notifications
```

---

## Sources

1. [Designing Multi-Tenant SaaS Architecture on AWS: The Complete Guide for 2026](https://www.clickittech.com/software-development/multi-tenant-architecture/) - ClickIT Tech
2. [Architectural Approaches for Governance and Compliance in Multitenant Solutions](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/governance-compliance) - Microsoft Learn
3. [Architectural Approaches for Storage and Data in Multitenant Solutions](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/storage-data) - Microsoft Learn
4. [Multi-Tenant Isolation - Hosting & Cloud Solutions - HIPAA Compliant](https://www.hipaavault.com/managed-services/multi-tenant-isolation/) - HIPAA Vault
5. [How to Build Scalable Multi-Tenant SaaS Architectures](https://seedium.io/blog/how-to-build-multi-tenant-saas-architecture/) - Seedium
6. [Multi-Tenant SaaS for Healthcare: Security & Compliance Best Practices](https://medium.com/@kodekx-solutions/multi-tenant-saas-for-healthcare-security-and-compliance-best-practices-21cc247e8125) - Medium
7. [Best Practices for Multi-Tenant Authorization](https://www.permit.io/blog/best-practices-multi-tenant-authorization) - Permit.io
8. [Building Role-Based Access Control for a Multi-Tenant SaaS Startup](https://medium.com/@my_journey_to_be_an_architect/building-role-based-access-control-for-a-multi-tenant-saas-startup-26b89d603fdb) - Medium
9. [Domain-Driven Design: A Comprehensive Guide to Validation Across Layers](https://medium.com/@serhatalftkn/domain-driven-design-a-comprehensive-guide-to-validation-across-layers-8955d6854e7d) - Medium
10. [Multi-Tenant Architecture in Next.js: A Complete Guide](https://medium.com/@itsamanyadav/multi-tenant-architecture-in-next-js-a-complete-guide-25590c052de0) - Medium
11. [Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) - Microsoft Learn
12. [n8n as a SaaS Backend: A Strategic Guide from MVP to Enterprise Scale](https://medium.com/@tuguidragos/n8n-as-a-saas-backend-a-strategic-guide-from-mvp-to-enterprise-scale-be13823f36c1) - Medium
13. [AI Governance Frameworks for 2025: How AI Gateways Turn Policy into Practice](https://www.truefoundry.com/blog/ai-governance-framework) - TrueFoundry
14. [Multi-tenancy - Architecting for HIPAA Security and Compliance on Amazon EKS](https://docs.aws.amazon.com/whitepapers/latest/architecting-hipaa-security-and-compliance-on-amazon-eks/multi-tenancy.html) - AWS
15. [Content Approval Workflows Guide](https://influenceflow.io/resources/content-approval-workflows-complete-guide-for-teams-in-2025/) - InfluenceFlow
