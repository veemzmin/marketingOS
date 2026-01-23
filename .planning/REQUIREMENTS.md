# Requirements: Marketing OS

**Defined:** 2026-01-21
**Core Value:** Governance at generation time, not as an afterthought

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Access Control

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can enable 2FA (TOTP or security key)
- [x] **AUTH-03**: User can log in and stay logged in across sessions
- [x] **AUTH-04**: User can log out from any page
- [x] **AUTH-05**: System enforces role-based permissions (Creator, Reviewer, Admin)
- [x] **AUTH-06**: Admin can invite users to organization with assigned roles

### Governance & Policy Validation

- [ ] **GOV-01**: System validates content against 5-7 core policies in real-time
- [ ] **GOV-02**: System flags unsupported medical claims
- [ ] **GOV-03**: System flags stigmatizing mental health language (50-100 terms)
- [ ] **GOV-04**: System validates DSM-5 terminology usage
- [ ] **GOV-05**: System requires qualified statements for treatment advice
- [ ] **GOV-06**: System flags content discussing suicide without crisis resources
- [ ] **GOV-07**: System requires consent documentation for patient testimonials
- [ ] **GOV-08**: System scores content 0-100 for policy compliance
- [ ] **GOV-09**: System provides inline suggestions for policy violations

### Content Creation & Optimization

- [ ] **CONT-01**: Creator can create content drafts with metadata (topic, audience, tone)
- [ ] **CONT-02**: Creator sees real-time policy feedback while editing
- [ ] **CONT-03**: Creator can save drafts
- [ ] **CONT-04**: Creator can submit content for review
- [ ] **CONT-05**: Creator can view content status (draft, submitted, approved, rejected)
- [ ] **CONT-06**: System stores content versions
- [ ] **CONT-07**: Creator can generate blog posts with topic and target audience
- [ ] **CONT-08**: System optimizes blog content for search engines (keywords, meta descriptions, headings)
- [ ] **CONT-09**: System provides SEO score for blog posts
- [ ] **CONT-10**: Creator can generate social media posts optimized for platform
- [ ] **CONT-11**: System optimizes social content for platform algorithms (hashtags, length, formatting)
- [ ] **CONT-12**: System suggests optimal posting times based on platform and audience
- [ ] **CONT-13**: Creator can generate image content with AI (via n8n)
- [ ] **CONT-14**: Creator can generate video content with AI (via n8n)

### Review Workflow

- [ ] **REV-01**: System routes submitted content to appropriate reviewers based on role
- [ ] **REV-02**: Clinical reviewer can review content for safety/accuracy
- [ ] **REV-03**: Marketing reviewer can review content for brand alignment
- [ ] **REV-04**: Reviewer sees content side-by-side with policy violations
- [ ] **REV-05**: Reviewer can approve, reject, or request changes with comments
- [ ] **REV-06**: Reviewer receives email notification when content needs review
- [ ] **REV-07**: Creator receives notification of review decision
- [ ] **REV-08**: System prevents content progression without all required approvals

### Audit Trail

- [x] **AUD-01**: System logs every content creation with user, timestamp, organization
- [x] **AUD-02**: System logs every policy check result
- [x] **AUD-03**: System logs every review decision with reviewer and reasoning
- [x] **AUD-04**: Audit logs are immutable (append-only)
- [x] **AUD-05**: Admin can export audit logs as CSV
- [x] **AUD-06**: System retains audit logs for 7 years

### Multi-Tenancy

- [x] **TENT-01**: System isolates organization data (no cross-tenant data access)
- [x] **TENT-02**: System extracts organization context from subdomain/path
- [x] **TENT-03**: System enforces organization context in all database queries
- [x] **TENT-04**: System provides defense-in-depth with PostgreSQL RLS policies
- [x] **TENT-05**: System tests multi-tenant isolation with concurrent requests

### AI Generation

- [ ] **AI-01**: System generates content using OpenAI with policy-constrained prompts
- [ ] **AI-02**: System grounds health claims in curated knowledge base (RAG)
- [ ] **AI-03**: System flags unverified health claims for expert review
- [ ] **AI-04**: System integrates with n8n for image/video generation
- [ ] **AI-05**: System tracks generation job status

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Publishing Automation

- **PUB-01**: System publishes approved content to Instagram
- **PUB-02**: System publishes approved content to Facebook
- **PUB-03**: System publishes approved content to LinkedIn
- **PUB-04**: System publishes approved content to Twitter
- **PUB-05**: System tracks post-publish performance metrics

### Content Calendar

- **CAL-01**: User can view content calendar by week/month
- **CAL-02**: User can drag-and-drop content to schedule
- **CAL-03**: System suggests optimal posting schedule
- **CAL-04**: User can see gaps in content calendar

### Analytics

- **ANA-01**: User can view engagement metrics per platform
- **ANA-02**: User can view governance compliance trends
- **ANA-03**: User can export performance reports

### Agency Management

- **AGY-01**: Agency can manage multiple client accounts
- **AGY-02**: Agency can clone governance profiles across clients
- **AGY-03**: Agency can view cross-client analytics

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| A/B testing | Single content path sufficient for v1; adds complexity |
| Collaborative editing | Governance requires sequential review; real-time editing conflicts with approval workflow |
| Batch approval | Healthcare content too nuanced; each piece needs individual review |
| Content templates | Dangerous in healthcare; encourages copying without understanding context |
| Auto-approve on minor edits | All changes require re-review for healthcare compliance |
| Real-time chat | Not core to governance workflow; async comments sufficient |
| Mobile app | Web-first approach; mobile browser sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| TENT-01 | Phase 1 | Pending |
| TENT-02 | Phase 1 | Pending |
| TENT-03 | Phase 1 | Pending |
| TENT-04 | Phase 1 | Pending |
| TENT-05 | Phase 1 | Pending |
| AUD-01 | Phase 1 | Pending |
| AUD-02 | Phase 1 | Pending |
| AUD-03 | Phase 1 | Pending |
| AUD-04 | Phase 1 | Pending |
| AUD-05 | Phase 1 | Pending |
| AUD-06 | Phase 1 | Pending |
| GOV-01 | Phase 2 | Pending |
| GOV-02 | Phase 2 | Pending |
| GOV-03 | Phase 2 | Pending |
| GOV-04 | Phase 2 | Pending |
| GOV-05 | Phase 2 | Pending |
| GOV-06 | Phase 2 | Pending |
| GOV-07 | Phase 2 | Pending |
| GOV-08 | Phase 2 | Pending |
| GOV-09 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| CONT-06 | Phase 3 | Pending |
| REV-01 | Phase 4 | Pending |
| REV-02 | Phase 4 | Pending |
| REV-03 | Phase 4 | Pending |
| REV-04 | Phase 4 | Pending |
| REV-05 | Phase 4 | Pending |
| REV-06 | Phase 4 | Pending |
| REV-07 | Phase 4 | Pending |
| REV-08 | Phase 4 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |
| AI-05 | Phase 5 | Pending |
| CONT-07 | Phase 5 | Pending |
| CONT-08 | Phase 5 | Pending |
| CONT-09 | Phase 5 | Pending |
| CONT-10 | Phase 5 | Pending |
| CONT-11 | Phase 5 | Pending |
| CONT-12 | Phase 5 | Pending |
| CONT-13 | Phase 5 | Pending |
| CONT-14 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53 (100% coverage ✓)
- Unmapped: 0

**Phase Distribution:**
- Phase 1 (Foundation & Authentication): 17 requirements
- Phase 2 (Governance Engine): 9 requirements
- Phase 3 (Content Creation): 6 requirements
- Phase 4 (Review Workflow): 8 requirements
- Phase 5 (AI Generation): 13 requirements

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after roadmap creation*
