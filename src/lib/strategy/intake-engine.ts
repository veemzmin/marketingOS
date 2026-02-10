/**
 * NorthNode Strategy Intake Engine
 *
 * Deterministic heuristic engine for behavioral health campaign planning.
 * Constraints: trauma-informed tone, no outcome claims, no urgency language,
 * no conversion pressure, compliance-aware, no patient stories by default.
 *
 * Deliverables:
 *   1. Signal detection
 *   2. Archetype decision tree
 *   3. Cadence rules
 *   4. Experiment library (charter-safe)
 *   5. Missing info question generator
 *   6. plannerPrompt builder
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalKey =
  | "launch"
  | "compliance"
  | "social"
  | "email"
  | "flyer"
  | "integration-of-care"
  | "stakeholders-unclear"
  | "referral-enablement"
  | "trust-building"
  | "compliance-visibility"

export type CampaignArchetype =
  | "program-launch"
  | "trust-building"
  | "compliance-visibility"
  | "referral-enablement"

export type CadencePattern =
  | "drip"
  | "weekly-anchor"
  | "hybrid"
  | "milestone-triggered"

export type ExperimentSafetyClass = "format" | "framing" | "sequencing"
export type StakeholdersClarityLevel = "high" | "medium" | "low"

export interface Signal {
  key: SignalKey
  detected: boolean
  matchedTerms: string[]
}

export interface CadenceRule {
  archetype: CampaignArchetype
  pattern: CadencePattern
  description: string
  rationale: string
  emailFrequency: string
  socialFrequency: string
}

export interface Experiment {
  id: string
  name: string
  hypothesis: string
  variantA: string
  variantB: string
  safetyClass: ExperimentSafetyClass
  applicableArchetypes: CampaignArchetype[]
}

export interface MissingInfoQuestion {
  id: string
  question: string
  triggeredBy: SignalKey[]
  impactsArchetype: boolean
  impactsCadence: boolean
  placeholder?: string
}

export interface IntakeAnalysis {
  signals: Signal[]
  detectedSignalKeys: SignalKey[]
  primaryArchetype: CampaignArchetype
  secondaryArchetype?: CampaignArchetype
  cadenceRule: CadenceRule
  experiments: Experiment[]
  missingInfoQuestions: MissingInfoQuestion[]
  requiresVisibilityArchive: boolean
  requiresApprovalWorkflow: boolean
  confidenceScore: number
  evidence: Partial<Record<SignalKey, string[]>>
  stakeholdersClarityLevel: StakeholdersClarityLevel
  stack: string[]
  plannerPrompt: string
  suggestedAudience: string[]
  suggestedGoals: string[]
  suggestedCadence: string[]
}

// ─── 1. Signal Detection Patterns ────────────────────────────────────────────
// "stakeholders-unclear" is no longer injected by the engine (clarity is graded instead).

const SIGNAL_PATTERNS: Partial<Record<SignalKey, string[]>> = {
  launch: [
    "launch", "launching", "new program", "rollout", "opening",
    "announcing", "announce", "debut", "introducing", "new service",
    "go live", "going live", "open enrollment", "start date",
  ],
  compliance: [
    "compliance", "compliant", "state approval", "regulation", "regulatory",
    "review required", "approval", "hipaa", "hitech", "carf", "jcaho",
    "joint commission", "accreditation", "audit", "licensed", "licensure",
    "certification", "dhhs", "state-licensed", "medicaid", "medicare",
  ],
  social: [
    "social", "social media", "instagram", "facebook", "linkedin",
    "tiktok", "twitter", "post", "posts", "organic", "feed", "stories",
  ],
  email: [
    "email", "e-mail", "newsletter", "drip", "nurture", "subscriber",
    "mailing list", "mailchimp", "constant contact", "inbox", "sequence",
    "email campaign",
  ],
  flyer: [
    "flyer", "flyers", "print", "handout", "brochure", "poster",
    "one-pager", "pamphlet", "rack card", "tear-off", "physical distribution",
  ],
  "integration-of-care": [
    "integration", "integrated care", "co-located", "collocated",
    "primary care", "pcp", "bh integration", "behavioral health integration",
    "warm handoff", "care coordination", "embedded", "co-management",
    "care team", "collaborative care",
  ],
  "referral-enablement": [
    "referral", "referrals", "referrers", "referring", "provider partner",
    "partner providers", "b2b", "physician", "physicians", "prescriber",
    "outpatient referral", "inpatient referral", "care manager",
    "case manager", "ed referral", "hospital referral",
  ],
  "trust-building": [
    "awareness", "stigma", "destigma", "community", "education",
    "outreach", "inform", "visibility", "brand awareness",
    "thought leadership", "credibility", "public facing", "community trust",
  ],
  "compliance-visibility": [
    "demonstrate compliance", "show compliance", "annual report",
    "transparency report", "compliance report", "stakeholder report",
    "board report", "funder report", "accreditation report",
    "performance dashboard",
  ],
}

// Terms that indicate a specific audience is named — used for clarity grading.
const AUDIENCE_TERMS = [
  "provider", "physician", "pcp", "referrer", "family", "families",
  "adult", "adults", "client", "clients",
  "patient", "patients", "community member", "community members",
  "partner", "employer", "employee", "teenager", "adolescent", "youth",
  "caregiver", "peer", "justice-involved", "veteran", "parent",
]

const VAGUE_AUDIENCE_TERMS = [
  "everyone", "anybody", "general public", "all people", "everybody",
  "anyone who", "the public",
]

function detectStakeholdersClarityLevel(text: string): StakeholdersClarityLevel {
  const matchCount = AUDIENCE_TERMS.filter((t) => text.includes(t)).length
  const hasVague = VAGUE_AUDIENCE_TERMS.some((t) => text.includes(t))
  if (hasVague) return "low"
  if (matchCount >= 2) return "high"
  if (matchCount === 1) return "medium"
  return "low"
}

function detectSignals(text: string): Signal[] {
  const signals: Signal[] = (
    Object.keys(SIGNAL_PATTERNS) as SignalKey[]
  ).map((key) => {
    const terms = SIGNAL_PATTERNS[key] ?? []
    const matchedTerms = terms.filter((t) => text.includes(t))
    return { key, detected: matchedTerms.length > 0, matchedTerms }
  })
  return signals
}

function computeEvidence(signals: Signal[]): Partial<Record<SignalKey, string[]>> {
  const evidence: Partial<Record<SignalKey, string[]>> = {}
  for (const sig of signals) {
    if (sig.detected && sig.matchedTerms.length > 0) {
      evidence[sig.key] = sig.matchedTerms
    }
  }
  return evidence
}

const STRONG_SIGNALS: SignalKey[] = ["launch", "referral-enablement", "compliance"]
const SUPPORTING_SIGNALS: SignalKey[] = ["social", "email", "flyer"]

function computeConfidenceScore(
  detectedKeys: SignalKey[],
  clarityLevel: StakeholdersClarityLevel
): number {
  let score = 50
  for (const key of detectedKeys) {
    if (STRONG_SIGNALS.includes(key)) score += 10
    else if (SUPPORTING_SIGNALS.includes(key)) score += 5
  }
  if (clarityLevel === "low") score -= 10
  else if (clarityLevel === "medium") score -= 5
  return Math.min(100, Math.max(0, score))
}

function buildStack(
  primary: CampaignArchetype,
  secondary?: CampaignArchetype
): string[] {
  const stacks: Record<CampaignArchetype, string[]> = {
    "program-launch": [
      "Pre-launch micro-sequence (2 weeks)",
      "Launch-week anchor content",
      "Post-launch 4-week drip",
      "Approval checkpoint template",
    ],
    "referral-enablement": [
      "Provider enablement drip (5-7 touches)",
      "Referral one-pager",
      "LinkedIn post series",
    ],
    "trust-building": [
      "Weekly anchor post series",
      "Monthly newsletter",
      "Educational content clusters",
    ],
    "compliance-visibility": [
      "Milestone communication templates",
      "Documentation/archive snapshot",
      "Stakeholder one-pager",
    ],
  }

  const base = stacks[primary].slice()

  if (secondary) {
    const secondaryAddons: Partial<Record<CampaignArchetype, string>> = {
      "referral-enablement": "Provider enablement one-pager (secondary)",
      "trust-building": "Community awareness post series (secondary)",
      "compliance-visibility": "Compliance milestone note (secondary)",
      "program-launch": "Launch announcement template (secondary)",
    }
    const addon = secondaryAddons[secondary]
    if (addon) base.push(addon)
  }

  return base
}

function buildSuggestions(primary: CampaignArchetype): {
  suggestedAudience: string[]
  suggestedGoals: string[]
  suggestedCadence: string[]
} {
  const suggestions: Record<CampaignArchetype, {
    suggestedAudience: string[]
    suggestedGoals: string[]
    suggestedCadence: string[]
  }> = {
    "trust-building": {
      suggestedAudience: ["Patients", "Families", "Community members"],
      suggestedGoals: [
        "Build awareness of services",
        "Reduce stigma",
        "Explain whole-person care",
      ],
      suggestedCadence: [
        "3x/week social + monthly email",
        "2x/week social + biweekly email",
      ],
    },
    "program-launch": {
      suggestedAudience: ["Patients", "Families", "Community partners"],
      suggestedGoals: [
        "Announce the program launch",
        "Explain how to get started",
        "Drive early inquiries",
      ],
      suggestedCadence: [
        "Daily social during launch week + weekly email",
        "3x/week social + 1 email/week",
      ],
    },
    "referral-enablement": {
      suggestedAudience: ["Clinicians", "Care coordinators", "Referral partners"],
      suggestedGoals: [
        "Educate providers on referral process",
        "Increase qualified referrals",
        "Build clinical trust",
      ],
      suggestedCadence: [
        "Biweekly email drip + 2x/week LinkedIn",
        "Monthly provider update + 2x/week LinkedIn",
      ],
    },
    "compliance-visibility": {
      suggestedAudience: ["Board members", "Compliance stakeholders", "Funder partners"],
      suggestedGoals: [
        "Document compliance milestones",
        "Provide visibility into approvals",
        "Share audit-ready updates",
      ],
      suggestedCadence: [
        "Milestone-triggered updates only",
        "Quarterly summary + milestone posts",
      ],
    },
  }

  return suggestions[primary]
}

// ─── 2. Archetype Decision Tree ───────────────────────────────────────────────
//
// Priority tiers:
//   T1  compliance-visibility  — explicit stakeholder/funder reporting need
//   T2  program-launch         — time-bounded activation need
//   T3  referral-enablement    — provider/B2B education (incl. integration-of-care)
//   T4  trust-building         — default; community awareness / stigma reduction

function selectArchetype(detected: SignalKey[]): {
  primary: CampaignArchetype
  secondary?: CampaignArchetype
} {
  const has = (k: SignalKey) => detected.includes(k)

  // T1
  if (has("compliance-visibility")) {
    const secondary = has("launch")
      ? "program-launch"
      : has("referral-enablement") || has("integration-of-care")
        ? "referral-enablement"
        : has("trust-building")
          ? "trust-building"
          : undefined
    return { primary: "compliance-visibility", secondary }
  }

  // T2
  if (has("launch")) {
    const secondary =
      has("referral-enablement") || has("integration-of-care")
        ? "referral-enablement"
        : has("trust-building")
          ? "trust-building"
          : undefined
    return { primary: "program-launch", secondary }
  }

  // T3
  if (has("referral-enablement") || has("integration-of-care")) {
    return {
      primary: "referral-enablement",
      secondary: has("trust-building") ? "trust-building" : undefined,
    }
  }

  // T4 default
  return { primary: "trust-building" }
}

// ─── 3. Cadence Rules ─────────────────────────────────────────────────────────

export const CADENCE_RULES: Record<CampaignArchetype, CadenceRule> = {
  "program-launch": {
    archetype: "program-launch",
    pattern: "hybrid",
    description:
      "Pre-launch awareness (weeks −2 to −1) → launch-week anchor (daily social, 1 email) → post-launch drip (3×/week social, weekly email for 4–6 weeks)",
    rationale:
      "Launch windows are time-bounded. Front-loading awareness avoids urgency pressure on the audience; post-launch drip sustains reach while giving people space to engage on their own terms.",
    emailFrequency:
      "Weekly during pre-launch; 2× during launch week; weekly for 4–6 weeks post-launch",
    socialFrequency:
      "3×/week pre-launch; daily launch week (max 7 days); 3×/week post-launch",
  },
  "trust-building": {
    archetype: "trust-building",
    pattern: "weekly-anchor",
    description:
      "Consistent weekly anchor post + 2 supporting posts; monthly email touchpoint; no campaign spikes or saturation windows",
    rationale:
      "Irregular bursts in stigma-adjacent or community-trust work feel transactional and institutional. Consistent low-volume presence signals long-term commitment and allows audiences to engage at their own pace.",
    emailFrequency: "Monthly or bimonthly; never more than 2× per month",
    socialFrequency:
      "3×/week steady-state; no more than one topic cluster per week",
  },
  "compliance-visibility": {
    archetype: "compliance-visibility",
    pattern: "milestone-triggered",
    description:
      "Milestone-gated communications tied to specific events (accreditation renewal, annual report, board review) rather than continuous drip",
    rationale:
      "Compliance communications require approval before each send. Drip cadences create review bottlenecks and approval fatigue. Milestone-triggered batches consolidate review cycles into predictable windows.",
    emailFrequency:
      "Event-triggered only; explicit approval gate required before each send",
    socialFrequency:
      "Event-triggered; 1–3 posts per milestone; no automated scheduling",
  },
  "referral-enablement": {
    archetype: "referral-enablement",
    pattern: "drip",
    description:
      "Educational drip series (5–7 touches over 6–8 weeks) for provider audiences; begins with one-pager introduction, followed by clinical context emails",
    rationale:
      "Providers need repeated exposure to build referral confidence. Drip format respects their inbox and allows them to review clinical information between interactions without pressure to act immediately.",
    emailFrequency:
      "Biweekly for 6–8 weeks; then quarterly re-engagement touchpoint",
    socialFrequency:
      "LinkedIn-first; 2×/week; clinical education framing only",
  },
}

// ─── 4. Curated Experiment Library (Charter-Safe) ────────────────────────────
// All experiments are format-, framing-, or sequencing-based.
// No patient stories, no outcome claims, no urgency language in any variant.

export const EXPERIMENT_LIBRARY: Experiment[] = [
  {
    id: "EXP-01",
    name: "Subject line: question vs. statement",
    hypothesis:
      "Question-format subject lines increase open rates by activating curiosity without urgency pressure",
    variantA: 'Statement: "Our IOP program now accepts [insurance]"',
    variantB: 'Question: "Does your insurance cover intensive outpatient?"',
    safetyClass: "framing",
    applicableArchetypes: ["program-launch", "referral-enablement"],
  },
  {
    id: "EXP-02",
    name: "Email send timing: Tuesday AM vs. Thursday PM",
    hypothesis:
      "Provider-audience emails perform differently by day/time; BH audiences may prefer end-of-week sends when workload is lower",
    variantA: "Tuesday 9–10 AM local",
    variantB: "Thursday 3–4 PM local",
    safetyClass: "sequencing",
    applicableArchetypes: [
      "referral-enablement",
      "trust-building",
      "program-launch",
    ],
  },
  {
    id: "EXP-03",
    name: 'CTA phrasing: "explore" vs. "learn more"',
    hypothesis:
      '"Explore" is lower-commitment and more congruent with trauma-informed language than directive action verbs',
    variantA: '"Learn more about the program"',
    variantB: '"Explore how the program works"',
    safetyClass: "framing",
    applicableArchetypes: [
      "program-launch",
      "trust-building",
      "referral-enablement",
    ],
  },
  {
    id: "EXP-04",
    name: "Content sequence: services-first vs. values-first",
    hypothesis:
      "Leading with organizational values before clinical services improves trust signals for stigma-adjacent audiences",
    variantA: "Email 1 = services overview; Email 2 = approach/values",
    variantB: "Email 1 = approach/values; Email 2 = services overview",
    safetyClass: "sequencing",
    applicableArchetypes: ["trust-building", "program-launch"],
  },
  {
    id: "EXP-05",
    name: "Flyer layout: visual-anchor vs. text-anchor",
    hypothesis:
      "For provider-facing print, information-dense text layouts outperform consumer-style visual layouts",
    variantA: "Visual-anchor (large image, minimal supporting text)",
    variantB:
      "Text-anchor (bullet-point clinical criteria, smaller supporting image)",
    safetyClass: "format",
    applicableArchetypes: ["referral-enablement", "program-launch"],
  },
  {
    id: "EXP-06",
    name: "Email length: short vs. medium",
    hypothesis:
      "Short emails (≤150 words) reduce cognitive load for clinical audiences; medium length (≤300 words) may be needed for complex program descriptions",
    variantA: "Short (≤150 words, single topic per email)",
    variantB: "Medium (≤300 words, 2–3 supporting points per email)",
    safetyClass: "format",
    applicableArchetypes: [
      "referral-enablement",
      "trust-building",
      "program-launch",
    ],
  },
  {
    id: "EXP-07",
    name: "Referral tool format: one-pager vs. checklist",
    hypothesis:
      "Checklists reduce provider decision friction for referrals compared to narrative one-pagers",
    variantA: "Narrative one-pager (program description + contact, 1 page)",
    variantB:
      "Referral checklist (eligibility criteria + step-by-step process, 1 page)",
    safetyClass: "format",
    applicableArchetypes: ["referral-enablement"],
  },
  {
    id: "EXP-08",
    name: "Newsletter cadence: weekly vs. biweekly",
    hypothesis:
      "Biweekly cadence reduces unsubscribe rates in trust-building phases without meaningful engagement loss",
    variantA: "Weekly newsletter (same day each week)",
    variantB: "Biweekly newsletter (alternating weeks)",
    safetyClass: "sequencing",
    applicableArchetypes: ["trust-building"],
  },
  {
    id: "EXP-09",
    name: "Social post format: plain text vs. branded card",
    hypothesis:
      "Plain-text posts on LinkedIn signal authenticity and generate higher engagement for behavioral health topics",
    variantA: "Branded image card with caption",
    variantB: "Plain text post (no image, LinkedIn native format)",
    safetyClass: "format",
    applicableArchetypes: ["trust-building", "referral-enablement"],
  },
  {
    id: "EXP-10",
    name: "Header framing: program name vs. benefit statement",
    hypothesis:
      "Benefit-statement headers outperform program-name headers for audiences unfamiliar with the program",
    variantA: "Program name as primary header (e.g., 'NorthNode IOP')",
    variantB:
      "Benefit statement as primary header, program name secondary (e.g., 'Specialized care for co-occurring conditions')",
    safetyClass: "framing",
    applicableArchetypes: ["program-launch", "trust-building"],
  },
]

// ─── 5. Missing Info Question Generator ──────────────────────────────────────
// Each question maps to the signals that trigger it.
// Questions triggered by "stakeholders-unclear" are handled via clarity grading.

export const MISSING_INFO_QUESTIONS: MissingInfoQuestion[] = [
  {
    id: "MIQ-01",
    question:
      "Who is the primary audience for this campaign (e.g., individuals seeking care, family members, referring providers, community partners)?",
    triggeredBy: ["stakeholders-unclear"],
    impactsArchetype: true,
    impactsCadence: true,
    placeholder: "Describe the primary audience in specific terms",
  },
  {
    id: "MIQ-02",
    question:
      "What geography or service region does this campaign cover (local community, county-wide, statewide, multi-state)?",
    triggeredBy: ["compliance", "flyer", "launch"],
    impactsArchetype: false,
    impactsCadence: false,
    placeholder: "e.g., Greater Boston metro; statewide NH; 3 counties",
  },
  {
    id: "MIQ-03",
    question:
      "Is there a required clinical, legal, or state compliance review process before content is published, and what is the typical turnaround?",
    triggeredBy: ["compliance"],
    impactsArchetype: false,
    impactsCadence: true,
    placeholder: "Describe the review process and typical turnaround time",
  },
  {
    id: "MIQ-04",
    question:
      "Which communication channels are currently active and in use by the organization (email list size, social platforms, print distribution points)?",
    triggeredBy: ["social", "email", "flyer"],
    impactsArchetype: false,
    impactsCadence: true,
    placeholder:
      "e.g., Email list ~500 subscribers; Instagram 800 followers; no current print",
  },
  {
    id: "MIQ-05",
    question:
      "Is there a specific launch date, program milestone, or external deadline this campaign must align with or precede?",
    triggeredBy: ["launch", "compliance-visibility"],
    impactsArchetype: true,
    impactsCadence: true,
    placeholder: "e.g., Program opens March 1; accreditation survey April 15",
  },
  {
    id: "MIQ-06",
    question:
      "Are there existing referral partnerships or care coordination relationships this campaign should support, introduce, or avoid overlapping with?",
    triggeredBy: ["referral-enablement", "integration-of-care"],
    impactsArchetype: true,
    impactsCadence: false,
    placeholder:
      "e.g., 12 PCPs in our network; new hospital partnership launching Q2",
  },
  {
    id: "MIQ-07",
    question:
      "Has the organization received explicit, documented consent to use any client or patient perspectives (testimonials, stories, photography) in communications?",
    triggeredBy: ["trust-building", "compliance"],
    impactsArchetype: false,
    impactsCadence: false,
    placeholder:
      "Yes / No. If yes, describe the consent process and formats available.",
  },
  {
    id: "MIQ-08",
    question:
      "Who are the internal stakeholders with approval authority over campaign content, and what is their typical review timeline?",
    triggeredBy: ["stakeholders-unclear", "compliance", "compliance-visibility"],
    impactsArchetype: false,
    impactsCadence: true,
    placeholder:
      "e.g., Clinical Director + Compliance Officer; 5 business days",
  },
  {
    id: "MIQ-09",
    question:
      "What is the primary campaign objective: increasing community awareness, supporting program enrollment inquiry, or generating provider referrals?",
    triggeredBy: [
      "stakeholders-unclear",
      "trust-building",
      "launch",
      "referral-enablement",
    ],
    impactsArchetype: true,
    impactsCadence: true,
    placeholder: "Select or describe the primary objective",
  },
  {
    id: "MIQ-10",
    question:
      "Are there other organizational communications or campaigns scheduled in the same window that this campaign must coordinate with or avoid?",
    triggeredBy: ["launch", "compliance-visibility"],
    impactsArchetype: false,
    impactsCadence: true,
    placeholder:
      "e.g., Annual appeal letter in October; board meeting in Q1; another program launch",
  },
]

// ─── 6. Planner Prompt Builder ────────────────────────────────────────────────

function buildPlannerPrompt(params: {
  intakeText: string
  ideasText: string
  industry: string
  audience: string
  goals: string
  analysis: Omit<IntakeAnalysis, "plannerPrompt">
}): string {
  const { intakeText, ideasText, industry, audience, goals, analysis } = params

  const approvalNote =
    analysis.requiresApprovalWorkflow || analysis.requiresVisibilityArchive
      ? "\nAPPROVAL WORKFLOW NOTE: Compliance or state-review signals were detected. Every deliverable section must include an explicit approval checkpoint. No content may be marked ready-to-publish without documented sign-off."
      : ""
  const claimsNote = ["launch", "compliance", "referral-enablement", "integration-of-care"].some(
    (key) => analysis.detectedSignalKeys.includes(key as SignalKey)
  )
    ? "\nCLAIMS NOTE: Confirm all program claims are qualified and do not imply clinical outcomes."
    : ""

  const experimentList = analysis.experiments
    .map((e) => `  ${e.id} — ${e.name} [${e.safetyClass}]`)
    .join("\n")

  const gapList =
    analysis.missingInfoQuestions.length > 0
      ? "\nUNRESOLVED INTAKE GAPS (treat as open assumptions; surface in plan):\n" +
        analysis.missingInfoQuestions
          .map((q) => `  - [${q.id}] ${q.question}`)
          .join("\n")
      : ""

  const archetypeLabel =
    analysis.primaryArchetype.toUpperCase() +
    (analysis.secondaryArchetype
      ? ` + ${analysis.secondaryArchetype.toUpperCase()} (secondary layer)`
      : "")

  const cadence = analysis.cadenceRule

  return [
    "You are a marketing strategy lead for a behavioral health organization.",
    "Build a campaign plan from the intake notes below.",
    "",
    "━━━ MANDATORY CONSTRAINTS (non-negotiable) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "• Tone: calm, trauma-informed, non-urgent throughout all deliverables",
    "• No clinical advice, outcome promises, or recovery guarantees of any kind",
    "• No urgency or scarcity language ('act now', 'limited spots', 'don't wait')",
    "• No conversion pressure: audiences decide if and when to engage",
    "• Do not include patient or client stories unless documented consent is confirmed in the intake",
    "• All proposed experiments must be format-, framing-, or sequencing-based only",
    "• Do not propose experiments that involve patient narratives, clinical claims, or urgency framing",
    approvalNote,
    claimsNote,
    "",
    "━━━ ORGANIZATION CONTEXT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Organization type: ${industry || "Behavioral health provider"}`,
    `Primary audience: ${audience || "Unspecified — see intake gaps below"}`,
    `Campaign goals: ${goals || "Unspecified — see intake gaps below"}`,
    "",
    "━━━ ENGINE OUTPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Campaign archetype: ${archetypeLabel}`,
    `Cadence pattern: ${cadence.pattern.toUpperCase()} — ${cadence.description}`,
    `Email frequency: ${cadence.emailFrequency}`,
    `Social frequency: ${cadence.socialFrequency}`,
    `Cadence rationale: ${cadence.rationale}`,
    "",
    "━━━ INTAKE NOTES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    intakeText || "No primary intake text provided.",
    "",
    ideasText ? `Rough ideas / additional context:\n${ideasText}` : "",
    gapList,
    "",
    "━━━ DELIVERABLES (in order) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "1. Campaign brief — 2–3 sentences: what, for whom, and why this moment. No outcome claims.",
    "2. Messaging pillars — 3–4 themes. Each must be trauma-informed and non-prescriptive.",
    "3. Channel and cadence plan — use the cadence pattern above as the baseline; justify any deviations.",
    "4. Content calendar outline — 4–6 weeks; show themes and post types, not final copy.",
    "5. Recommended A/B experiments — select only from this pre-approved library:",
    experimentList,
    "6. Required assets list — include suggested owners (internal vs. vendor) for each.",
    "7. Approval checkpoints — mark every step where review is required before proceeding.",
    "8. Three open questions — surface assumptions that would materially change this plan if answered differently.",
    "",
    "FORMAT: Use section headers. Write in prose, not bullet lists within sections.",
    "Do not use urgency language. Do not make outcome claims. Honor all constraints above.",
  ]
    .filter((line) => line !== null)
    .join("\n")
    .trim()
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export interface IntakeParams {
  intakeText: string
  ideasText?: string
  industry?: string
  audience?: string
  goals?: string
}

export function analyzeIntake(params: IntakeParams): IntakeAnalysis {
  const {
    intakeText,
    ideasText = "",
    industry = "",
    audience = "",
    goals = "",
  } = params

  const combined =
    `${intakeText}
${ideasText}
${industry}
${audience}
${goals}`
      .trim()
      .toLowerCase()

  // 1. Detect signals
  const signals = detectSignals(combined)
  const detectedSignalKeys = signals
    .filter((s) => s.detected)
    .map((s) => s.key)

  const stakeholdersClarityLevel = detectStakeholdersClarityLevel(combined)

  // 2. Select archetype
  const { primary, secondary } = selectArchetype(detectedSignalKeys)

  const evidence = computeEvidence(signals)
  const confidenceScore = computeConfidenceScore(
    detectedSignalKeys,
    stakeholdersClarityLevel
  )
  const stack = buildStack(primary, secondary)
  const suggestions = buildSuggestions(primary)

  // 3. Cadence rule
  const cadenceRule = CADENCE_RULES[primary]

  // 4. Experiments ? filter to archetypes in play, cap at 5
  const archetypes: CampaignArchetype[] = [
    primary,
    ...(secondary ? [secondary] : []),
  ]
  const experiments = EXPERIMENT_LIBRARY.filter((exp) =>
    exp.applicableArchetypes.some((a) => archetypes.includes(a))
  ).slice(0, 5)

  // 5. Missing info questions ? triggered by detected signals
  let missingInfoQuestions = MISSING_INFO_QUESTIONS.filter((q) =>
    q.triggeredBy.some((sig) => detectedSignalKeys.includes(sig))
  )

  // MIQ-01 post-processing: stakeholders-unclear signal no longer injected,
  // so manually ensure MIQ-01 surfaces when clarity is low.
  const miq01 = MISSING_INFO_QUESTIONS.find((q) => q.id === "MIQ-01")
  if (
    stakeholdersClarityLevel === "low" &&
    miq01 &&
    !missingInfoQuestions.some((q) => q.id === "MIQ-01")
  ) {
    missingInfoQuestions = [...missingInfoQuestions, miq01]
  }

  const requiresVisibilityArchive =
    detectedSignalKeys.includes("compliance") ||
    detectedSignalKeys.includes("compliance-visibility")

  const APPROVAL_GATE_TERMS = [
    "approval required",
    "review required",
    "sign-off",
    "must be approved",
    "requires approval",
    "needs approval",
    "awaiting approval",
  ]
  const requiresApprovalWorkflow = APPROVAL_GATE_TERMS.some((t) =>
    combined.includes(t)
  )

  const partial: Omit<IntakeAnalysis, "plannerPrompt"> = {
    signals,
    detectedSignalKeys,
    confidenceScore,
    stakeholdersClarityLevel,
    primaryArchetype: primary,
    secondaryArchetype: secondary,
    cadenceRule,
    experiments,
    stack,
    missingInfoQuestions,
    requiresApprovalWorkflow,
    requiresVisibilityArchive,
    evidence,
    suggestedAudience: suggestions.suggestedAudience,
    suggestedGoals: suggestions.suggestedGoals,
    suggestedCadence: suggestions.suggestedCadence,
  }

  // 7. Build governed planner prompt
  const plannerPrompt = buildPlannerPrompt({
    intakeText,
    ideasText,
    industry,
    audience,
    goals,
    analysis: partial,
  })

  return { ...partial, plannerPrompt }
}
