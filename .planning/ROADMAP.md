# Roadmap: Marketing OS

## Overview

Marketing OS delivers governance-first content operations for healthcare and mental health organizations. The roadmap progresses from secure multi-tenant foundations through real-time policy validation, content creation workflows, review automation, and AI-powered generation. Each phase builds verifiable capabilities that prevent compliance violations at generation time rather than catching them after the fact.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Multi-tenant architecture with secure access control
- [x] **Phase 2: Governance Engine** - Real-time policy validation and compliance scoring
- [x] **Phase 3: Content Creation** - Draft creation with live governance feedback
- [x] **Phase 4: Review Workflow** - Role-based approval workflows and notifications
- [x] **Phase 5: AI Generation** - Intelligent content generation with n8n integration
- [ ] **Phase 6: Strategy Intake Upgrade** - Improve trust, explainability, and compliance safety for behavioral health marketing

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Secure multi-tenant platform where users can authenticate and system enforces complete data isolation
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, TENT-01, TENT-02, TENT-03, TENT-04, TENT-05, AUD-01, AUD-02, AUD-03, AUD-04, AUD-05, AUD-06
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password
  2. User can enable 2FA and log in securely across sessions
  3. User can log out from any page
  4. Admin can invite users to organization with assigned roles (Creator, Reviewer, Admin)
  5. System enforces role-based permissions preventing unauthorized actions
  6. System completely isolates organization data (no cross-tenant access possible)
  7. System logs every action (user, timestamp, resource, action) immutably
  8. Admin can export audit logs as CSV for compliance reporting
**Plans**: 8 plans

Plans:
- [x] 01-01-PLAN.md — Next.js project initialization with TypeScript and Tailwind
- [x] 01-02-PLAN.md — Database schema with multi-tenant models and RLS policies
- [x] 01-03-PLAN.md — Core authentication with Auth.js and password hashing
- [x] 01-04-PLAN.md — Email verification flow with token generation
- [x] 01-05-PLAN.md — TOTP 2FA with speakeasy and QR code enrollment
- [x] 01-06-PLAN.md — Multi-tenant middleware and RLS context enforcement
- [x] 01-07-PLAN.md — Audit logging middleware with CSV export
- [x] 01-08-PLAN.md — User management and role-based permissions

### Phase 2: Governance Engine
**Goal**: Real-time policy validation that scores content compliance and provides actionable feedback
**Depends on**: Phase 1 (requires auth, multi-tenancy, audit logging)
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06, GOV-07, GOV-08, GOV-09
**Success Criteria** (what must be TRUE):
  1. System validates content against 5-7 core healthcare policies in real-time
  2. System flags unsupported medical claims automatically
  3. System detects and flags stigmatizing mental health language (50-100 terms)
  4. System validates DSM-5 terminology usage
  5. System requires qualified statements for treatment advice
  6. System flags content discussing suicide without crisis resources
  7. System requires consent documentation for patient testimonials
  8. System provides 0-100 compliance score with clear reasoning
  9. System provides inline suggestions for fixing policy violations
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Policy definitions and governance type system
- [ ] 02-02-PLAN.md — Compliance scoring engine with weighted penalties

### Phase 3: Content Creation
**Goal**: Content creation interface where creators draft content with immediate governance feedback
**Depends on**: Phase 2 (requires governance engine for real-time validation)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. Creator can create content drafts with metadata (topic, audience, tone)
  2. Creator sees real-time policy feedback while editing (highlighting violations)
  3. Creator can save drafts and return to them later
  4. Creator can submit content for review when ready
  5. Creator can view all their content with current status (draft, submitted, in review, approved, rejected)
  6. System stores all content versions for audit trail
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md — Content schema with versioning and form dependencies
- [x] 03-02-PLAN.md — Server actions with governance integration
- [x] 03-03-PLAN.md — Content editor UI and dashboard
- [x] 03-04-PLAN.md — UI feedback fixes (save indicator visibility, success toast)
- [x] 03-05-PLAN.md — Governance policy expansion (inflected forms, cure language)
- [x] 03-06-PLAN.md — Compliance score display in editor UI

### Phase 4: Review Workflow
**Goal**: Automated review routing where content flows through appropriate approvers with notifications
**Depends on**: Phase 3 (requires content to review)
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-08
**Success Criteria** (what must be TRUE):
  1. System automatically routes submitted content to appropriate reviewers based on role
  2. Clinical reviewer can review content for safety and accuracy
  3. Marketing reviewer can review content for brand alignment
  4. Reviewer sees content side-by-side with policy violations highlighted
  5. Reviewer can approve, reject, or request changes with comments
  6. Reviewer receives email notification when content needs their review
  7. Creator receives notification of review decision with feedback
  8. System prevents content from progressing without all required approvals
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Review workflow schema (ReviewAssignment, ReviewerType, multi-reviewer support)
- [x] 04-02-PLAN.md — Review queue and routing logic
- [x] 04-03-PLAN.md — Review UI with governance feedback
- [x] 04-04-PLAN.md — Review notifications

### Phase 5: AI Generation
**Goal**: AI-powered content generation with governance constraints and n8n media generation
**Depends on**: Phase 2 (governance engine), Phase 4 (approval workflow)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, CONT-07, CONT-08, CONT-09, CONT-10, CONT-11, CONT-12, CONT-13, CONT-14
**Success Criteria** (what must be TRUE):
  1. System generates content using OpenAI with policy-constrained prompts
  2. System grounds health claims in curated knowledge base (RAG prevents hallucinations)
  3. System flags unverified health claims for expert review
  4. Creator can generate blog posts with topic and target audience
  5. System optimizes blog content for SEO (keywords, meta descriptions, headings)
  6. System provides SEO score for blog posts
  7. Creator can generate social media posts optimized for platform
  8. System optimizes social content for platform algorithms (hashtags, length, formatting)
  9. System suggests optimal posting times based on platform and audience
  10. Creator can trigger image generation via n8n integration
  11. Creator can trigger video generation via n8n integration
  12. System tracks generation job status and updates content when complete
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — n8n integration layer (webhooks, job tracking, callbacks)
- [x] 05-02-PLAN.md — AI text generation with governance prompts
- [x] 05-03-PLAN.md — Blog post generation with SEO optimization
- [x] 05-04-PLAN.md — Social media generation with platform optimization
- [x] 05-05-PLAN.md — Image and video generation via n8n

### Phase 6: Strategy Intake Upgrade
**Goal**: Improve trust, explainability, and compliance safety for behavioral health marketing strategy intake
**Depends on**: Phase 5 (strategy intake engine built in prior phases)
**Success Criteria** (what must be TRUE):
  1. Engine outputs confidenceScore (0–100, deterministic rule-based)
  2. Engine outputs evidence map per detected signal (linked to matchedTerms)
  3. Engine outputs requiresVisibilityArchive and requiresApprovalWorkflow as separate flags
  4. Engine outputs stakeholdersClarityLevel (high/medium/low) replacing binary unclear flag
  5. Engine outputs campaign stack (archetype-driven, 3–6 items)
  6. UI surfaces all new fields: confidence, signals, clarity, stack, why section, separate compliance notes
  7. Safety guardrails enforce no urgency CTAs and no patient stories in experiment library
  8. Channels are archetype-first; paid social only appears with explicit paid signal
  9. Channel and asset arrays are deduplicated
  10. Risk logic triggers claims warning on any healthcare-related signal
**Plans**: 4 plans

Plans:
- [ ] 06-01-PLAN.md — Engine upgrade: new types, graded clarity, confidence score, evidence, split flags, stack
- [ ] 06-02-PLAN.md — Action mapper: pass-through new fields, archetype-first channels, dedup, risk fix
- [ ] 06-03-PLAN.md — UI upgrade: signal chips, confidence bar, clarity indicator, stack, why section, compliance notes
- [ ] 06-04-PLAN.md — Safety tests: guardrails for urgency CTAs, patient stories, and behavioral regression tests

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 8/8 | ✓ Complete | 2026-01-23 |
| 2. Governance Engine | 2/2 | ✓ Complete | 2026-01-25 |
| 3. Content Creation | 6/6 | ✓ Complete | 2026-01-29 |
| 4. Review Workflow | 4/4 | ✓ Complete | 2026-01-29 |
| 5. AI Generation | 5/5 | ✓ Complete | 2026-01-29 |
| 6. Strategy Intake Upgrade | 0/4 | In Progress | — |

---
*Roadmap created: 2026-01-21*
*Last updated: 2026-02-10*
