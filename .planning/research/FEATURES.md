# Feature Landscape

**Domain:** Healthcare content governance + marketing automation with AI-powered generation
**Project:** Marketing OS for mental health agencies
**Researched:** 2026-01-21
**Scope:** V1 MVP (single client, single campaign, end-to-end)

---

## Executive Summary

Healthcare content governance platforms require a fundamentally different feature set than general content marketing tools. While platforms like Buffer and CoSchedule focus on multi-channel publishing, scheduling, and analytics, healthcare governance platforms (like Sprinklr) and HIPAA-compliant marketing automation prioritize **compliance-at-generation**, **role-based review workflows**, and **immutable audit trails**.

For V1 (NorthNode Mental Health Awareness Month), focus on the 5-6 table stakes features that make the platform functionally complete for one client. Defer analytics, multi-channel publishing, and campaign calendar to V2. The core differentiator is **real-time policy validation during content generation**—this is where healthcare governance platforms differentiate and where solo developer effort should concentrate.

---

## Table Stakes

Features users expect. Missing = product feels incomplete. These are **non-negotiable for V1**.

| Feature | Why Expected | Complexity | Dependency | Healthcare Context |
|---------|--------------|------------|------------|-------------------|
| **Content Generation UI** | Core product function: write/generate content | Medium | None | Mental health messaging must be evidence-based, culturally sensitive |
| **Policy Validation Engine** | Real-time feedback on compliance issues | High | Content generation | HIPAA, FDA guidance, stigma-reduction standards (DSM-5 language) |
| **Role-Based Access Control** | Enforce separation of duties (writer, reviewer, approver) | Medium | Auth system | Mental health content requires clinical review (often licensed counselor sign-off) |
| **Approval Workflow** | Route content through reviewers before generation complete | Medium | RBAC + notification system | Regulatory requirement: documented review trail for behavioral health (CMS, SAMHSA) |
| **Immutable Audit Trail** | Log who did what, when, why for all actions | High | All actions | HIPAA, state mental health licensing boards require proof of governance |
| **Content Review Interface** | Read-only view for reviewers to see generated content + policy flags | Medium | Content generation + validation engine | Reviewers need clear policy violation explanations (not technical jargon) |

**Why These First:**
- Users cannot use the platform without content generation and validation
- Compliance violations are disqualifying for healthcare
- Single client v1 doesn't need multi-user collaboration yet, but still needs role structure for future scaling
- Audit trail is non-negotiable in regulated industries; retrofitting is expensive

**Anti-Dependencies (Don't Build Yet):**
- Multi-tenant client isolation (v1 is single client)
- Publishing to social/email/web (v1 stays in generator)
- Analytics dashboards (v1 is governance-focused)
- Content calendar/scheduling (v1 is linear workflow)

---

## Differentiators

Features that set the platform apart. Not expected, but provide competitive advantage or enable the business model.

| Feature | Value Proposition | Complexity | Notes | Why Healthcare Needs It |
|---------|-------------------|------------|-------|------------------------|
| **Policy-in-Code Validation** | Policies defined as executable rules, not spreadsheets | High | Requires domain-specific rule engine | Healthcare policies change frequently (FDA guidance, DSM-5 updates, state laws); code-based validation is version-controllable and auditable |
| **Mental Health Stigma Checker** | Scans content for stigmatizing language (e.g., "crazy," "schizo," "attention-seeker") and offers alternatives | High | NLP + healthcare terminology database | Behavioral health content is uniquely sensitive; platforms don't exist that do this well; directly supports campaign goals (stigma reduction) |
| **Medication/Diagnosis Claim Validator** | Flags unsupported medical claims in real time | High | Integration with FDA/NAMI databases or LLM fine-tuning | FDA has strict rules on health claims; missing this causes regulatory violations and reputational harm |
| **Evidence-Based Guidance Inline** | Suggests DSM-5 language, citing research backing | Medium-High | Integration with research databases (PubMed, APA) | Mental health orgs need credibility; suggesting evidence-based language is a training aid and differentiator |
| **Reviewer Workflow Notifications** | Notify reviewers of pending approvals without email chaos | Medium | Simple pub/sub system | Reduces approval delays and cognitive load (mental health teams are often small, overworked) |
| **Approval SLAs & Escalation** | Track time-to-approval, auto-escalate stalled reviews | Medium | Scheduling + notification system | Governance only works if reviews happen; SLAs prevent content from sitting in limbo |
| **Policy Diff View** | When policy rules change, show what was affected/approved under old rules | High | Version control + content indexing | Regulatory defense: "Here's proof we reviewed this under the rules that existed when we approved it" |

**Why These Differentiate:**
- General content platforms don't handle healthcare-specific validation (no mental health stigma checker in Buffer/CoSchedule)
- Approval SLAs and escalation turn governance from "nice-to-have" to "reliable" (critical for regulated industries)
- Evidence-based guidance is training tool + quality lever (teams write better mental health content when shown research)

**Effort/Impact Trade-offs for V1:**
- **High effort, high impact:** Mental health stigma checker (directly supports campaign mission, no other platform does this)
- **High effort, medium impact:** Medication/diagnosis validator (important, but can manual-review for v1)
- **Medium effort, high impact:** Reviewer notifications + SLAs (governance only works if reviews happen)
- **Defer:** Policy diff view (valuable for mature workflows, not needed v1)
- **Defer:** Evidence-based guidance inline (nice-to-have, manual education can substitute)

---

## Feature Dependencies

```
Content Generation
    ├─ Policy Validation Engine (runs on generated content)
    │   └─ Policy Rule Database (rules to validate against)
    │
    ├─ Approval Workflow
    │   ├─ Role-Based Access Control (determines who can approve)
    │   ├─ Notification System (alerts reviewers)
    │   └─ Audit Trail (logs approval decision)
    │
    └─ Content Review Interface (shows validation results to reviewers)
        ├─ Audit Trail (shows decision history)
        └─ Role-Based Access Control (who can see what)

Reviewer Actions (approve/reject/request changes)
    └─ Audit Trail (immutable record)

For V2 (future):
    Publishing
        ├─ Content storage/versioning
        └─ Audit Trail (who published what when)

    Analytics
        ├─ Content metadata (topic, audience, language level)
        └─ Audit Trail (usage data)
```

**Critical Path for V1:**
1. Content Generation + Review Interface → User can write
2. Policy Validation Engine → User knows if content complies
3. Approval Workflow + RBAC → Team can govern (not just one person)
4. Audit Trail → You can prove governance happened (regulatory requirement)

---

## Anti-Features

Features to explicitly **NOT** build in V1. Common mistakes in healthcare content platforms.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Multi-channel Publishing** (publish to Twitter, LinkedIn, email, web in one click) | Scope creep; healthcare compliance differs wildly by channel. LinkedIn has different rules than email. Implementing this delays core governance. | V1: Copy-paste from platform (user handles channel-specific rules). V2: Build channel adapters with channel-specific validators. |
| **Analytics Dashboard** (engagement metrics, reach, impressions) | Healthcare teams don't make content decisions based on engagement metrics—they make them based on clinical need and regulatory guidance. Time investment not justified for v1. | Excel export or integration with existing analytics tools. V2: Dashboard if orgs ask. |
| **Content Calendar/Scheduling** (plan content weeks in advance, schedule publication) | Mental health awareness campaigns run on event calendars, not rolling schedules. Single-client v1 doesn't need this. Multi-tenant agencies need it, but that's v2. | Users plan externally (Google Sheets, existing calendar), generate+approve in Marketing OS. |
| **Template Library** (pre-built content templates for "depression awareness post" etc.) | Healthcare templates are dangerous: people copy templates without understanding context, resulting in generic/inappropriate content. Better to teach users to generate+validate. | V2: Pattern library (show examples of *approved* content, with context why it passed). Don't make copying frictionless. |
| **AI-Powered Content Generation Without Governance Hooks** (generate content, then validate) | This inverts the process. Governance should shape generation (policies → constraints → better output), not just filter output. | V1: Generation + real-time validation feedback (user sees flags while editing). Policy engine informs LLM system prompt. |
| **Batch Approval** (approve 10 pieces at once) | Healthcare content is nuanced. Batch approval encourages skimming instead of actual review. Reviewers should have cognitive load to assess each piece individually. | Single-item approval with clear, high-context review interface. If reviewer is swamped, that's a staffing issue, not a UX fix. |
| **Auto-Approve on Minor Changes** (if user only fixes typo in approved content, skip review) | Healthcare context matters. A "minor" typo fix in a depression treatment description could change meaning. All content changes require re-review. | Every save creates new version requiring re-approval. Version control shows what changed. |
| **Algorithmic Approval Routing** (AI suggests who should approve based on content topic) | Too much cognitive overhead for v1. Routing rules require training data and fine-tuning. Static roles are better. | V1: Fixed approval routing (all mental health content → Clinical Reviewer, then Communications Manager). |
| **User Comments/Collaborative Editing** (multiple people editing same document simultaneously, leaving comments) | Mental health content shouldn't be iteratively edited in real-time. It should be written, validated, reviewed, approved. Back-and-forth editing creates ambiguity in governance. | Approval workflow includes "request changes" reason field. Writer revises offline, resubmits. Cleaner audit trail. |
| **Social Listening/Monitoring** (listen for brand mentions, competitor activity) | Out of scope. Healthcare governance is about your *outbound* content, not inbound monitoring. | No monitoring. Governance is generation + approval. |

**Why These Are Traps:**
- **Scope creep:** Each feature adds 1-2 weeks. V1 timeline is tight.
- **Governance anti-patterns:** Features like batch approval and collaborative editing look "productive" but undermine compliance.
- **Dangerous in healthcare:** Templates and auto-approve create false sense of safety. Better to be slow and deliberate.
- **Not healthcare-specific:** Analytics, scheduling, publishing are general content tools. They're not your differentiator.

---

## MVP Feature Set for V1

**What to build (in this order):**

1. **Content Generation UI** (Week 1-2)
   - Textarea + submit
   - Basic metadata (topic, audience, tone)
   - One mental health domain (e.g., depression awareness)
   - No images/rich media in v1

2. **Policy Validation Engine** (Week 2-3)
   - 5-7 core policies:
     - "No unsupported medical claims"
     - "No stigmatizing language" (with curated term list)
     - "Appropriate DSM-5 terminology"
     - "Qualified statement required for treatment advice"
     - "No targeted diagnosis language (meta ad rules)"
     - "Include crisis resources link if discussing suicide"
     - "Patient testimonials require signed consent"
   - Real-time validation on input
   - Clear, non-technical flagging

3. **Role-Based Access Control** (Week 1-2)
   - Creator role (can generate, see own drafts)
   - Reviewer role (can see drafts, approve/reject/request changes)
   - Admin role (manage roles, view audit trail)
   - No multi-tenant isolation in v1

4. **Approval Workflow** (Week 3-4)
   - Draft → Submitted for Review → Approved/Rejected
   - Reviewer can request changes (with reason)
   - Creator notified of approval/rejection
   - No parallel approvals, no SLAs in v1

5. **Immutable Audit Trail** (Week 4)
   - Log every action: created, submitted, approved, rejected, viewed
   - Who, what, when, changes made
   - Exportable as CSV
   - Retention: 7 years minimum (HIPAA)

6. **Content Review Interface** (Week 3-4)
   - Side-by-side: content + policy validation results
   - Approve/Reject/Request Changes buttons
   - Comment field (optional, max 500 chars)
   - Previous versions visible (audit trail)

**Defer to V2:**
- Content calendar
- Publishing to any channel
- Analytics
- Multi-tenant isolation
- Batch operations
- Advanced scheduling
- API (internal only for v1)
- Social integrations

**Explicitly Don't Build:**
- Collaborative editing
- Auto-approve on minor changes
- Content templates
- Auto-routing
- Monitoring/listening

---

## Feature Complexity Guidance

For solo developer v1, complexity tiers:

| Tier | Estimate | Examples | Risk |
|------|----------|----------|------|
| **Low** (3-5 days) | Form + basic validation | Content generation UI, RBAC, basic audit logging | Low |
| **Medium** (1-2 weeks) | Integration + state management | Approval workflow, notification system, review interface | Medium |
| **High** (2-4 weeks) | ML/NLP or complex business logic | Stigma checker (NLP), medication validator (API integration), policy diff view | High |

**V1 Time Budget (8 weeks):**
- Auth/RBAC: 1 week
- Content UI: 1 week
- Approval workflow: 1.5 weeks
- Policy engine (rule-based, no NLP): 1.5 weeks
- Review interface: 1 week
- Audit trail: 1 week
- Stigma checker (NLP-based): 1 week (stretch goal, may defer)
- Testing/polish/contingency: 1 week

**Stigma Checker Trade-offs:**
- **Option A (High quality, 1-2 weeks):** Fine-tune small LLM on curated mental health stigma dataset. Owns the differentiator.
- **Option B (Faster, medium quality, 3-4 days):** Regex-based term matcher (flag ~50 common stigmatizing terms). Works for MVP, expandable.
- **Option C (Defer):** Manual review for v1, add NLP in v2 if orgs ask.

Recommendation: **Option B** for v1 (fast, effective, defensible). Upgrade to Option A in v2 when you have customer feedback on what to flag.

---

## Healthcare Context: What Makes Mental Health Different

Standard content marketing tools assume:
- **Audience is infinite** (reach more people = better)
- **Engagement metrics = success** (high likes = good content)
- **Content is commodity** (variation is fine, templates save time)
- **Privacy is hygiene** (anonymize data, move on)

Mental health content requires:
- **Audience is specific** (depressed college students ≠ bipolar adults ≠ therapists). One-size-fits-all is harm.
- **Accuracy > engagement** (a misleading post that goes viral is a disaster)
- **Evidence matters** (you can't just sound authoritative; you have to *be* authoritative)
- **Privacy is trust** (people are disclosing mental health struggles; losing their data breaks the org)
- **Language is clinical** (words matter: "bipolar disorder" ≠ "bipolar"; one is diagnosis, one is stereotype)
- **Harm is real** (bad depression content can worsen depression; bad suicide content can increase suicide attempts)

This context drives every feature decision. The governance platform is not about "moving fast"—it's about moving *carefully*.

---

## Feature Landscape Summary Table

| Feature Category | V1 Must-Have | V1 Nice-to-Have | V2+ Future | Don't Build |
|------------------|--------------|-----------------|-----------|-------------|
| **Content Creation** | Generation UI, metadata fields | Rich text editor, media upload | Multi-step wizards, templates | Auto-templates, batch creation |
| **Governance** | Validation engine, approval workflow, RBAC, audit trail | Stigma checker, SLA tracking | Policy version control, diff view | Batch approval, auto-approve |
| **Review** | Review interface, clear flagging | Comment threads | Collaborative editing, suggestions | Inline editing, simultaneous editing |
| **Compliance** | HIPAA audit trail, role-based access, immutable logs | Retention policies, deletion workflows | Compliance reporting, export certifications | None (all critical for healthcare) |
| **Publishing** | Manual copy-paste | — | Channel adapters, scheduling | One-click multi-channel publish |
| **Analytics** | — | Export drafts | Usage dashboards, content performance | Engagement optimization tools |
| **Scaling** | — | — | Multi-tenant isolation, white-label, API | All v2+ |

---

## Success Metrics for V1 Feature Set

A feature set is complete when:

1. **One client can produce one campaign** from generation through approval without leaving the platform
2. **Governance is verifiable** (audit trail can prove every piece of content was reviewed by appropriate role)
3. **Policy violations are caught** in real time (validator catches 95%+ of common healthcare mistakes)
4. **Reviewers spend <5 mins per piece** (review interface is clear, not overwhelming)
5. **Compliance artifacts exist** (audit trail can be exported for regulator if needed)

If any of these fail, v1 is incomplete.

---

## Sources

- [Best Content Marketing Platforms 2026](https://thecmo.com/tools/content-marketing-platform/)
- [ContentCal, CoSchedule, Buffer Features](https://planable.io/blog/contentcal-alternatives/)
- [Sprinklr Governance and Compliance](https://www.sprinklr.com/products/social/governance-and-settings/)
- [HIPAA-Compliant Marketing Automation](https://www.givainc.com/blog/hipaa-compliant-marketing-automation-software/)
- [HIPAA Marketing Rules 2026](https://www.hipaajournal.com/hipaa-updates-hipaa-changes/)
- [Healthcare Content Governance Anti-Patterns](https://www.healthcareittoday.com/2026/01/13/healthcare-governance-regulations-and-compliance-2026-health-it-predictions/)
- [Approval Workflow Features](https://productive.io/blog/workflow-approval-software/)
- [Audit Trail Requirements](https://auditboard.com/blog/what-is-an-audit-trail/)
- [Behavioral Health Marketing Compliance 2026](https://www.cardinaldigitalmarketing.com/healthcare-resources/blog/mental-behavioral-health-trends-2026/)
- [Multi-Tenant SaaS Architecture](https://www.rishabhsoft.com/blog/how-to-build-a-multi-tenant-saas-application/)
- [Content Workflow Anti-Patterns](https://www.luminadatamatics.com/resources/blog/top-10-publishing-trends-to-watch-out-for-in-2026/)
- [FDA Marketing Claims in Healthcare](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/marketing/index.html)
