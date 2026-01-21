# Technology Stack

**Project:** Marketing OS - Policy-Governed Content Operations Platform
**Researched:** January 21, 2026
**Overall Confidence:** HIGH

---

## Executive Summary

For a multi-tenant SaaS platform with real-time governance validation, content versioning, and n8n integration in 2025, the recommended stack optimizes for **developer experience, maintainability, and security** while respecting solo developer constraints.

**Committed technologies** (Next.js 14, PostgreSQL, Prisma) form a solid foundation. The gaps below fill in authentication, state management, real-time communication, and healthcare compliance tooling. All recommendations verified against current official documentation and ecosystem patterns.

---

## Recommended Stack

### Core Framework & Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 14+ (14.2.x current) | Full-stack React framework with App Router | Committed. Excellent DX for SaaS with built-in API routes, middleware, server actions. App Router required for layout-based multi-tenancy. |
| **Node.js** | 20.x LTS or 22.x current | JavaScript runtime | Supports Next.js 14, stable LTS with excellent npm ecosystem. 22.x recommended for 2025. |
| **TypeScript** | 5.x | Static typing | Committed implicitly by Next.js. Prevents entire classes of multi-tenant bugs (tenant_id omissions, scope errors). |
| **React** | 19.x | UI framework | Latest stable release. Server Components native (no Suspense workarounds needed). Better streaming support. |

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** | 15.x or 16.x | Primary database | Committed. 15.x widely available in production. 16.x has performance improvements. Critical for multi-tenant RLS and audit logging. |
| **Prisma** | 5.x (5.14+) | ORM & schema management | Committed. Excellent multi-tenant support patterns. Recent versions support RLS policies. Strong TypeScript integration. Migrations are rock-solid for team + solo work. |
| **pgAudit** | Latest extension | Audit trail enforcement | PostgreSQL extension for database-level audit logging. Captures all DML/DDL events automatically. Compliance requirement for healthcare. |

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Auth.js (NextAuth.js)** | 5.x | Session & authentication | Currently in beta/stable. Version 4 remains safe (4.24.13), but migrate to v5 for Next.js 14 App Router support. Headless design fits SaaS patterns. Supports multiple providers (Google, GitHub, custom). |
| **Zod** | 3.x | Schema validation | Already common in React ecosystem. Validates environment variables, auth tokens, and request payloads. Prevents auth scope creaks. |

**Authentication Design Notes:**
- Use custom provider (email/password with 2FA) for healthcare requirement
- Skip OAuth for v1 (simpler auth scope, easier compliance)
- Implement tenant isolation at auth middleware level (check auth.tenant_id in every request)

### State Management & Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query (React Query)** | 5.x | Server state management | Industry standard for SaaS. Handles polling, caching, stale-while-revalidate for governance engine queries. Reduces component state pollution. |
| **Zustand** | 4.x | Client state (UI) | Tiny store for UI-only state (modals open/closed, filters, tab selection). Not for multi-tenant data. Simple to test in solo dev environment. |

**State Management Notes:**
- **DO NOT** store tenant context in Zustand — use middleware and server context
- **DO** use TanStack Query for policy checks, audit logs, content queries
- React Server Components handle most data fetching without client state

### Real-Time Communication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Socket.IO** | 4.x | WebSocket real-time updates | Handles policy validation feedback, review notifications, presence awareness. Easier than raw WebSockets. Supports reconnection, rooms (by tenant). Low learning curve for solo dev. |
| **Alternative: Pusher** | Managed service | If avoiding self-hosting | $10-40/mo for most SaaS. Recommended if deployment is Vercel (serverless functions can't open WebSocket connections). Skip for AWS ECS/self-hosted. |

**Real-Time Design Notes:**
- Use Socket.IO for governance engine feedback (policy score updates as user types)
- Use Server-Sent Events (SSE) for job status polling from n8n (simpler, unidirectional)
- Implement room isolation by tenant_id (no cross-tenant broadcast leakage)

### UI Components & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **shadcn/ui** | Latest | Copy-paste React components | Built on Radix UI primitives + Tailwind. Owns the components (not a dependency), so customize for healthcare design. AI-friendly. Active maintenance. Recommended for healthcare workflows. |
| **Tailwind CSS** | 4.x | Utility CSS framework | Pairs with shadcn/ui. Easy to theme for multi-tenant (different colors per org). Low overhead for solo dev. |
| **Radix UI** | 1.x | Headless primitives (if needed) | Already included in shadcn/ui. Use directly for advanced workflow UI if shadcn components insufficient. |

**UI Library Notes:**
- Use shadcn/ui for dashboards, modals, buttons, forms
- Consider **React Flow** or **Overflow** for workflow visualization (see Workflows section below)
- Avoid Material-UI (heavy, over-engineered for SaaS)

### Workflows & Governance UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Flow** | 11.x or latest | Visual workflow editor | Industry standard for node-based UIs (approval workflows, campaign structures). Pairs with Tailwind styling. Used by many SaaS platforms. |
| **React Flow UI** | Latest | Pre-built workflow components | Rapid prototyping for review workflows. Built on shadcn/ui. Can defer this if custom UI is needed. |

**Workflow Design Notes:**
- Review workflows (clinical reviewer → marketing reviewer) are core value
- React Flow visualizes routes, roles, and decision trees
- Store workflow configs as JSON in database, visualize with React Flow

### LLM Integration & Content Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **LangChain** | 0.x | LLM orchestration & governance | Handles prompt templating, output parsing, retrieval augmentation. Supports healthcare access control. Integrates with OpenAI, Anthropic, Cohere. NOT for real-time validation scoring (too heavy). |
| **OpenAI SDK** | 4.x | Direct API calls | For content generation calls triggered by n8n. Simple, lightweight. |
| **Anthropic SDK** | Latest | Alternative LLM provider | Consider Claude models for governance reasoning (better at policy adherence than GPT-4). |

**LLM Design Notes:**
- **DO** use LangChain for content generation pipeline (n8n → LangChain → OpenAI/Claude)
- **DO NOT** use LangChain for real-time governance scoring (too slow, use pattern matching + simpler rules)
- Implement HIPAA-safe LLM calls: no PHI transmitted, policies are safe to send to LLMs
- Consider prompt caching for repeated governance rules (OpenAI feature, saves latency + cost)

### n8n Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **n8n** | 1.43+ (self-hosted) | Workflow automation executor | Committed external dependency. Handles text/image/video generation, asset storage, social publishing. Separate from SaaS governance engine. |
| **node-fetch** or **axios** | Latest | HTTP client for n8n calls | Dispatch generation jobs to n8n via webhook. Handle callbacks on completion. |

**n8n Design Notes:**
- SaaS sends governance decision + content to n8n webhook
- n8n executes generation (text/image/video based on job type)
- n8n POSTs completion callback with asset URLs back to SaaS
- Store job status in database, poll with TanStack Query

### Testing & Quality

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | 1.x | Unit test runner | Fast, ESM-native, excellent TypeScript support. Lighter than Jest for solo dev. |
| **Testing Library** | Latest | React component testing | Standard for testing React. Encourages testing behavior, not implementation. |
| **Playwright** | Latest | End-to-end testing | Cross-browser E2E tests. Essential for multi-tenant flows (can't miss cross-tenant data leaks). |

**Testing Strategy Notes:**
- Unit tests: Governance logic, tenant isolation checks, auth middleware
- Component tests: Review workflow UI, policy feedback
- E2E tests: Full multi-tenant journeys (org A doesn't see org B content)

### Deployment & Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | Platform | Primary deployment (if available) | Created by Next.js team. Auto-scaling, zero-config deployments, excellent DX. Price: free tier + $20/mo for production. Limitation: no WebSocket support (use Pusher or polling). |
| **AWS (ECS or EC2)** | Latest | Alternative for control | Required if Vercel's serverless limitations are blockers (WebSocket, VPC access). More infrastructure overhead. Recommended for healthcare (HIPAA-aware BAA). |
| **Railway** | Platform | Middle ground | $5-50/mo simple deployment. Supports WebSocket, PostgreSQL hosting, simpler than AWS. Growing platform. |

**Deployment Notes:**
- **Start with Vercel**: Simplest path to MVP. Migrate to AWS ECS if cost/control becomes issue
- **AWS ECS recommended** if healthcare requires on-premises or specific region compliance
- **Database**: Use managed PostgreSQL (Vercel Postgres, AWS RDS, Railway Postgres)
- **Secrets management**: Use environment variables prefixed with AUTH_ (Auth.js convention)

### Healthcare Compliance Tooling

| Technology | Purpose | Why |
|----------|---------|-----|
| **Scytale.ai** or **Sprinto** | HIPAA compliance automation | Tracks controls, automates assessments, generates evidence. Not required for MVP but essential for client trust. Budget: $50-200/mo. |
| **pgAudit** | Database audit logging | Free. Captures all database activity. Non-repudiation for compliance. |

**Compliance Design Notes:**
- No PHI storage in application (only policy references)
- All database queries log via pgAudit
- All content decisions logged with governance reason
- Business Associate Agreements (BAAs) required with any vendor handling data

---

## Installation & Setup

### Initialize Next.js Project

```bash
# Create Next.js 14 project with TypeScript
npx create-next-app@latest marketing-os \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --no-src-dir \
  --no-git

cd marketing-os
```

### Install Core Dependencies

```bash
# ORM & Database
npm install @prisma/client prisma
npm install -D @types/node

# Authentication
npm install next-auth@5.0.0-beta.x
npm install zod

# State Management & Data Fetching
npm install @tanstack/react-query zustand

# Real-Time Communication (choose one)
npm install socket.io-client
# OR for Pusher (if Vercel):
npm install pusher pusher-js

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-slot class-variance-authority clsx tailwind-merge
# Then copy shadcn/ui components via CLI

# Workflow Visualization (if needed)
npm install reactflow

# LLM Integration
npm install langchain openai zod

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
```

### Database Setup

```bash
# Initialize Prisma
npx prisma init

# Configure .env with PostgreSQL connection
# DATABASE_URL="postgresql://user:password@localhost:5432/marketing_os"

# Create initial schema
# (see FEATURES.md for schema design)

npx prisma migrate dev --name init
```

### Environment Variables Template

```env
# Auth
AUTH_SECRET="$(openssl rand -hex 32)"
AUTH_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/marketing_os"

# n8n Integration
N8N_BASE_URL="http://localhost:5678"
N8N_WEBHOOK_KEY="[secure-key]"

# LLM Providers
OPENAI_API_KEY="[your-key]"
ANTHROPIC_API_KEY="[your-key]"

# Real-Time (Socket.IO or Pusher)
# For Socket.IO: no env needed
# For Pusher:
NEXT_PUBLIC_PUSHER_APP_KEY="[key]"
PUSHER_APP_ID="[id]"
PUSHER_SECRET="[secret]"

# Healthcare Compliance
HIPAA_AUDIT_LOG="true"
BAA_REQUIRED="true"
```

---

## Technology Decisions by Dimension

### Why NOT: Redux / Redux Toolkit

**Considered:** Standard enterprise choice
**Reason:** Over-engineered for SaaS MVP with TanStack Query. Adds boilerplate that solo dev must maintain. Zustand is sufficient for UI state, TanStack Query handles server state.

### Why NOT: Relay / GraphQL

**Considered:** Modern data fetching
**Reason:** REST APIs sufficient for v1. GraphQL adds complexity without payoff. n8n webhooks are REST. Multi-tenant filtering easier with REST (can scope by tenant_id in route middleware).

### Why NOT: tRPC

**Considered:** Type-safe full-stack
**Reason:** Good for monoliths, but adds RPC layer. REST + Zod validation simpler for solo dev. Less cognitive overhead than RPC client generation.

### Why NOT: Temporal Tables (PostgreSQL 15+)

**Considered:** Built-in versioning
**Reason:** Complex for multi-tenant schema (every table needs system-time columns). Prisma doesn't support well. Use trigger-based audit table instead (cleaner, proven).

### Why NOT: Citus / PostgreSQL Sharding

**Considered:** Scaling for millions of tenants
**Reason:** Not needed for v1 (single client). Shared schema with RLS sufficient. Premature optimization. Migrate to Citus only if tenant count hits 100K+.

### Why NOT: Direct WebSocket (raw ws)

**Considered:** Minimal dependency
**Reason:** Socket.IO handles reconnection, rooms, fallback transport. Raw WebSocket requires manual implementation of these patterns. Stick with Socket.IO for reliability.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Core Stack (Next.js, Prisma, PostgreSQL)** | HIGH | Committed. Verified with official docs. Proven pattern for multi-tenant SaaS. |
| **Authentication (Auth.js v5)** | HIGH | Official Next.js recommendation. Verified with docs and recent migration guides (2026). |
| **State Management** | HIGH | TanStack Query + Zustand is industry standard consensus for 2025 React. Verified across multiple recent sources. |
| **Real-Time (Socket.IO)** | MEDIUM | Works well for governance feedback. HIGH if deploying to AWS ECS. MEDIUM if Vercel (requires Pusher instead). |
| **UI Components (shadcn/ui)** | HIGH | Active maintenance, React 19 support, paired with Tailwind. Recommended for custom workflow UI. |
| **LLM Integration** | MEDIUM | LangChain recommended for healthcare, but real-time governance validation likely needs custom pattern matching (not LangChain). Verified with recent healthcare + AI governance sources. |
| **Healthcare Compliance** | HIGH | HIPAA requirements clear. pgAudit + RLS + BAAs are standard patterns. Verified with 2025 compliance tool surveys. |
| **n8n Integration** | HIGH | Proven external dependency (already built). Webhook integration is straightforward. Official docs available. |

---

## Solo Developer Considerations

✅ **Reduces Friction:**
- Next.js App Router handles routing + middleware (no express.js boilerplate)
- Prisma migrations run automatically in dev, version-controlled
- Auth.js v5 is headless (can style however, not locked into UI components)
- TanStack Query prevents prop drilling (no context hell)
- Tailwind + shadcn/ui = fast UI iteration without design skills

⚠️ **Adds Complexity:**
- Multi-tenant middleware (must check tenant_id in every request)
- PostgreSQL RLS policies (must be correct from day 1)
- Socket.IO server setup (learn async event handling)
- Audit logging schema (must be comprehensive for healthcare)

**Recommendation:** Start with REST + polling (no Socket.IO) if timeline is tight. Add real-time governance feedback (Socket.IO) in phase 2.

---

## Upgrade Path

| Component | v1 Decision | v2+ Path |
|-----------|------------|----------|
| Deployment | Vercel | → AWS ECS (for cost, control) or stay on Vercel (simple) |
| Database | PostgreSQL shared schema + RLS | → Citus extension (if 100K+ tenants) or second database cluster (write to reporting DB) |
| Real-Time | Socket.IO | → WebSocket room management, edge compute (Cloudflare Workers for geo-routing) |
| LLM | OpenAI calls via n8n | → Specialized governance LLM, fine-tuning on healthcare policies |
| Auth | Email + password + 2FA | → SSO (SAML) for enterprise healthcare systems |

---

## Sources

- [Next.js Official Docs - Multi-Tenant Architecture](https://nextjs.org/docs/app/guides/multi-tenant)
- [Auth.js Migration to v5 Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Prisma Multi-Tenancy Patterns](https://www.prisma.io/docs/guides/multiple-databases)
- [PostgreSQL Row-Level Security (RLS)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [TanStack Query State Management 2025 Trends](https://makersden.io/blog/react-state-management-in-2025)
- [shadcn/ui Component Library](https://ui.shadcn.com/)
- [Socket.IO vs Pusher for Real-Time Updates](https://www.mergesociety.com/code-report/websocets-explained)
- [LangChain for Healthcare Applications](https://www.invene.com/blog/langchain-turning-llm-predictions-into-structured-execution-for-healthcare)
- [PostgreSQL Audit Solutions (pgAudit, pgMemento)](https://www.bytebase.com/blog/postgres-audit-logging/)
- [n8n Webhook Integration](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [HIPAA Compliance Tools 2025](https://scytale.ai/resources/best-hipaa-compliance-tools/)
- [React UI Component Libraries Comparison 2025](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra)
