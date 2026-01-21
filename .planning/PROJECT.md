# Marketing OS

## What This Is

A policy-governed content operations platform that enables marketing teams in sensitive industries (healthcare, mental health, finance) to create compliant content at scale. The system enforces governance rules at generation time—validating every piece of content against client-specific policies, routing through role-based review workflows, and maintaining full audit trails. Unlike generic marketing tools, Marketing OS prevents compliance violations before they reach review.

## Core Value

Governance at generation time, not as an afterthought. Every piece of content is validated against policies as it's created, preventing compliance issues before they become problems.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Governance System:**
- [ ] Truth Pack management (client context documents: brand guidelines, voice, offers, compliance rules)
- [ ] Governance Profile system (reusable policy rulesets with pattern matching, tone rules, image rules)
- [ ] Real-time governance engine (pattern matching, scoring 0-100, routing decisions)
- [ ] Policy violation detection with inline highlighting and suggestions
- [ ] Campaign inheritance (campaigns restrict but never expand base governance)

**Campaign Management:**
- [ ] Campaign configuration system (YAML-based with governance inheritance)
- [ ] Campaign templates (ordered content sequences)
- [ ] Allowed/forbidden services per campaign
- [ ] Platform-specific settings (Instagram, Facebook, LinkedIn, Twitter)
- [ ] Hashtag management (required/optional/forbidden)

**Content Creation:**
- [ ] Content editor with real-time policy feedback
- [ ] Template-based content generation
- [ ] AI text generation with governance validation
- [ ] Image generation integration (n8n → DALL-E/Midjourney)
- [ ] Video generation integration (n8n → Veo3/HeyGen)
- [ ] Content versioning
- [ ] Draft auto-save

**Review Workflow:**
- [ ] Review queue (filterable by status, campaign, priority)
- [ ] Role-based routing (clinical reviewer + marketing reviewer for healthcare)
- [ ] Approve/reject/request changes with comments
- [ ] Escalation workflows for critical content
- [ ] Review notifications

**n8n Integration:**
- [ ] Webhook client for job dispatch
- [ ] Job types: text generation, image generation, video generation
- [ ] Callback handler for completion status
- [ ] Asset storage integration

**Multi-Tenancy:**
- [ ] Organization management
- [ ] Client management within organizations
- [ ] User roles (owner, admin, creator, reviewer, viewer)
- [ ] Authentication & authorization

**Audit & Compliance:**
- [ ] Event logging (all content decisions with reasoning)
- [ ] Governance check history
- [ ] Review action history
- [ ] Searchable audit trail

### Out of Scope

- **Automated social publishing** — Manual or basic n8n integration for v1, full automation later
- **Content calendar/planning engine** — Focus on generation + governance first
- **Analytics dashboard** — Track decisions yes, performance metrics later
- **A/B testing** — Single content path for v1
- **Agency dashboard** — Single org focus for v1, cross-client later
- **Client portal** — Internal tool first, client-facing later
- **Multiple governance profiles per client** — One profile per client is sufficient for v1
- **Viral research tools** — Focus on compliant content, not trend chasing in v1
- **Email campaign tools** — Social + blog only for v1
- **Backlink outreach** — SEO tools deferred to v2+

## Context

**Target Market:**
Healthcare and mental health organizations that need compliant social media content. These clients face strict regulatory requirements, high reputational risk, and potential harm from off-brand or insensitive content.

**Existing Assets:**
n8n workflows already built and working for image generation, video generation, blog posts, viral research, and social publishing via Telegram interface. These workflows are production-ready and will be integrated as external executors.

**Reference Client:**
NorthNode Health Services - trauma-informed healthcare provider. Their Mental Health Awareness Month 2026 campaign serves as the v1 validation case, representing the most restrictive governance requirements.

**Development Approach:**
Vertical slice methodology - build one client, one campaign, end-to-end before expanding features. Prove the governance engine works with the hardest case (healthcare/mental health), then other industries become easier.

**User Research:**
Based on agency experience, healthcare marketing teams struggle with:
1. Compliance risk from content that violates brand guidelines or platform policies
2. Inconsistent quality across team members and contractors
3. Slow review cycles that delay campaigns
4. No audit trail to explain why content was approved or rejected
5. Tool fragmentation requiring 10+ tools for one campaign

## Constraints

- **Team Size**: Solo developer (for now) — prioritize automation, tooling, and simple architectures
- **Tech Stack Core**: Next.js 14 (App Router), TypeScript, Prisma ORM, PostgreSQL (committed)
- **Tech Stack Flexible**: Auth provider, deployment platform, UI libraries, state management (open to recommendations)
- **Timeline**: No hard deadline, but v1 should be production-ready for NorthNode's May 2026 campaign
- **Budget**: Self-funded, minimize ongoing infrastructure costs where possible
- **Target Industry**: Healthcare/mental health first — most restrictive requirements
- **Compliance**: HIPAA-aware (no PHI storage, but content must be trauma-informed and policy-compliant)
- **Multi-Tenant**: Architecture must support multiple organizations from day one, even if launching with one client

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Healthcare/mental health first | Most restrictive governance requirements — if we nail this, other industries are easier | — Pending |
| Multi-tenant from start | Avoid costly refactor later, even if launching with single client | — Pending |
| Governance as core differentiator | Generic tools exist, but none enforce governance at generation time | — Pending |
| n8n for execution layer | Existing workflows proven, separation of concerns (SaaS decides, n8n executes) | — Pending |
| Web app primary, Telegram secondary | Professional SaaS experience, Telegram as power-user fallback | — Pending |
| One client vertical slice | Prove end-to-end value before expanding features | — Pending |
| Next.js + Prisma stack | Modern, type-safe, good DX for solo developer | — Pending |
| Role-based review workflow | Healthcare requires clinical reviewer + marketing reviewer | — Pending |

---
*Last updated: 2026-01-21 after initialization*
