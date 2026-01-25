# Phase 2: Governance Engine - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time policy validation that constrains AI content generation and validates output. The governance engine prevents non-compliant content from being generated (preventative) and catches any violations that slip through (detective). Scope covers validation logic, scoring, and violation reporting - NOT content creation UI or AI generation itself.

</domain>

<decisions>
## Implementation Decisions

### Architectural Approach
- **Defense in depth**: Policies both constrain AI prompts AND validate generated output
- Governance rules are injected into AI generation prompts as constraints (e.g., "Do not make unsupported medical claims")
- Post-generation validation runs as safety check in case AI ignores instructions
- When violations are detected in output: show content with violations flagged, user decides whether to regenerate or fix

### Violation Presentation
- Flat list format (no severity levels for MVP)
- Each violation shows:
  - Policy name that was violated
  - Problematic text snippet from content
  - Explanation of why it's a problem
- UI placement: Claude's discretion (sidebar, below content, or modal)

### Compliance Scoring
- 0-100 score serves multiple purposes:
  - Pass/fail threshold for approval workflows
  - Quality indicator to prioritize content needing attention
  - Audit metric for organizational compliance tracking
- Score calculation: Weighted by policy type
  - Different violation types have different point penalties
  - Medical claims violations > stigma language > formatting issues
- Hardcoded weights for MVP (not configurable per organization)

### Validation Trigger
- Runs automatically after AI generation completes
- User sees generated content + violation list + compliance score together
- For MVP: validation is not real-time during editing (content comes pre-generated)

### Claude's Discretion
- Exact UI placement of violation list
- Specific weight values for each policy type penalty
- Error handling when validation service fails
- Caching strategy for validation results

</decisions>

<specifics>
## Specific Ideas

- The governance engine is the "safety net" - it should catch things even when AI tries to follow rules
- Score should be immediately visible and intuitive (like a grade)
- Violations need enough context to understand the issue without reading documentation

</specifics>

<deferred>
## Deferred Ideas

- Severity levels (critical/warning/info) - future enhancement
- Real-time validation during manual editing - Phase 3 (Content Creation) concern
- Configurable weights per organization - future enhancement
- Auto-fix violations functionality - Phase 5 (AI Generation) enhancement
- Inline highlighting of violations in content - defer to Phase 3 UI work

</deferred>

---

*Phase: 02-governance-engine*
*Context gathered: 2026-01-25*
