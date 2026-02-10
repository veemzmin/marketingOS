import type {
  BriefGenerationInput,
  CampaignBrief,
  ComplianceNotes,
  MessagingPillar,
  RequiredAsset,
  ToneProfile,
} from "@/lib/brief/types"
import type { IntakeAnalysis, SignalKey } from "@/lib/strategy/intake-engine"

const PROHIBITED_REPLACEMENTS: Array<{ pattern: string; replaceWith: string | null }> = [
  { pattern: "will cure", replaceWith: null },
  { pattern: "will treat", replaceWith: null },
  { pattern: "will improve your", replaceWith: null },
  { pattern: "guarantees", replaceWith: null },
  { pattern: "clinically proven", replaceWith: "evidence-informed" },
  { pattern: "proven to", replaceWith: null },
  { pattern: "reduces symptoms", replaceWith: null },
]

const CONSTRAINTS_BASE = [
  "No advice statements (e.g., 'you should', 'you need to', 'you must')",
  "No clinical or health outcome promises",
  "No urgency CTAs",
  "No patient stories or testimonials by default (unlock explicitly if approved)",
]

const POSITIONING_FALLBACK =
  "A supportive environment for those seeking [service type] - focused on access, consistency, and care."

const PROGRAM_SUMMARY_FALLBACK =
  "[Organization] offers [service type] for [general audience]. Programs are designed to support wellbeing and connection."

const PRIMARY_AUDIENCE_MAP: Array<{ key: SignalKey; value: string }> = [
  { key: "referral-enablement", value: "Referring clinicians and care coordinators" },
  { key: "launch", value: "Community members seeking [service type]" },
  { key: "trust-building", value: "General community audience" },
  { key: "compliance-visibility", value: "Internal stakeholders and board" },
]

const CLAIMS_TRIGGER_SIGNALS: SignalKey[] = [
  "launch",
  "compliance",
  "referral-enablement",
  "integration-of-care",
]

const PROHIBITED_POSITIONING_TERMS = [
  "best",
  "only",
  "guaranteed",
  "proven",
  "cure",
  "fix",
  "eliminate",
  "most effective",
]

function incrementBriefVersion(existingVersion?: string): string {
  if (!existingVersion) return "1.0.0"
  const parts = existingVersion.split(".").map((part) => Number(part))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return "1.0.0"
  }
  const [major, minor, patch] = parts
  return `${major}.${minor}.${patch + 1}`
}

function stripProhibited(text: string): string | null {
  let updated = text
  for (const rule of PROHIBITED_REPLACEMENTS) {
    const lower = updated.toLowerCase()
    if (!lower.includes(rule.pattern)) continue
    if (rule.replaceWith === null) {
      return null
    }
    updated = updated.replace(new RegExp(rule.pattern, "gi"), rule.replaceWith)
  }
  return updated
}

function sanitizeArray(values: string[], fallback: string[]): string[] {
  const sanitized = values
    .map((value) => stripProhibited(value))
    .filter((value): value is string => Boolean(value))
  return sanitized.length > 0 ? sanitized : fallback
}

function sanitizePillars(pillars: MessagingPillar[]): MessagingPillar[] {
  const fallback = basePillars()
  const sanitized = pillars
    .map((pillar) => ({
      ...pillar,
      do: sanitizeArray(pillar.do, ["Highlight availability"]),
      avoid: sanitizeArray(pillar.avoid, ["Promise outcomes"]),
    }))
    .filter((pillar) => Boolean(pillar.pillar))
  return sanitized.length > 0 ? sanitized : fallback
}

function sanitizeTextOrFallback(value: string, fallback: string): string {
  const sanitized = stripProhibited(value)
  return sanitized ?? fallback
}

function basePillars(): MessagingPillar[] {
  return [
    {
      pillar: "Access",
      do: ["Highlight availability and ease of entry", "Emphasize no-barrier intake"],
      avoid: ["Promise outcomes", "Use urgency language"],
    },
    {
      pillar: "Consistency",
      do: ["Describe regular program touchpoints", "Reference cadence and structure"],
      avoid: ["Imply results from consistency alone", "Overpromise engagement outcomes"],
    },
    {
      pillar: "Community",
      do: ["Frame around belonging and connection", "Use inclusive language"],
      avoid: ["Tokenize specific populations", "Use inspiration-porn framing"],
    },
  ]
}

function archetypeLabel(primary: string): string {
  const map: Record<string, string> = {
    "program-launch": "Program Launch",
    "referral-enablement": "Referral Enablement",
    "trust-building": "Trust Building",
    "compliance-visibility": "Compliance Visibility",
  }
  return map[primary] ?? "Strategy"
}

function derivePrimaryAudience(analysis: IntakeAnalysis): string {
  for (const entry of PRIMARY_AUDIENCE_MAP) {
    if (analysis.detectedSignalKeys.includes(entry.key)) {
      return entry.value
    }
  }
  return "TBD"
}

function deriveSecondaryAudience(analysis: IntakeAnalysis): string | null {
  if (analysis.secondaryArchetype === "referral-enablement") {
    return "Referring clinicians and care coordinators"
  }
  if (analysis.secondaryArchetype === "trust-building") {
    return "Community members and general public"
  }
  return null
}

function derivePositioning(analysis: IntakeAnalysis): string {
  const candidate = analysis.plannerPrompt.split(".")[0]?.trim() || ""
  const lower = candidate.toLowerCase()
  if (!candidate || PROHIBITED_POSITIONING_TERMS.some((term) => lower.includes(term))) {
    return POSITIONING_FALLBACK
  }
  return candidate
}

function deriveProgramSummary(analysis: IntakeAnalysis): string {
  const candidate = analysis.plannerPrompt.split(".")[0]?.trim() || ""
  if (!candidate) return PROGRAM_SUMMARY_FALLBACK
  const sanitized = stripProhibited(candidate)
  return sanitized ?? PROGRAM_SUMMARY_FALLBACK
}

function deriveMessagingPillars(analysis: IntakeAnalysis): MessagingPillar[] {
  const pillars = basePillars()
  if (analysis.detectedSignalKeys.includes("referral-enablement")) {
    pillars.push({
      pillar: "Clinical Clarity",
      do: [
        "Describe referral process clearly",
        "Name intake requirements (not diagnostic criteria)",
      ],
      avoid: ["State clinical efficacy", "Describe patient outcomes"],
    })
  }
  if (
    analysis.detectedSignalKeys.includes("compliance-visibility") ||
    analysis.detectedSignalKeys.includes("compliance")
  ) {
    pillars.push({
      pillar: "Transparency",
      do: ["Document process and milestones", "Acknowledge regulatory context"],
      avoid: ["Use marketing framing in compliance content", "Overstate compliance status"],
    })
  }
  return pillars
}

function deriveToneProfile(primary: string): ToneProfile {
  const map: Record<string, ToneProfile> = {
    "program-launch": {
      calm: 6,
      upbeat: 8,
      formal: 5,
      tags: ["energetic", "accessible", "welcoming"],
    },
    "referral-enablement": {
      calm: 9,
      upbeat: 5,
      formal: 8,
      tags: ["clinical-appropriate", "factual", "professional"],
    },
    "trust-building": {
      calm: 8,
      upbeat: 7,
      formal: 4,
      tags: ["warm", "approachable", "evidence-informed"],
    },
    "compliance-visibility": {
      calm: 9,
      upbeat: 3,
      formal: 9,
      tags: ["neutral", "factual", "process-oriented"],
    },
  }
  return map[primary] ?? map["trust-building"]
}

function deriveComplianceNotes(analysis: IntakeAnalysis): ComplianceNotes {
  const claimsCautions: string[] = []
  if (CLAIMS_TRIGGER_SIGNALS.some((key) => analysis.detectedSignalKeys.includes(key))) {
    claimsCautions.push(
      "All health-adjacent claims must be scoped to availability and access, not efficacy or outcomes"
    )
  }
  if (analysis.detectedSignalKeys.includes("referral-enablement")) {
    claimsCautions.push(
      "Referral content must not describe diagnostic criteria or clinical outcomes"
    )
  }
  if (
    analysis.detectedSignalKeys.includes("compliance") ||
    analysis.detectedSignalKeys.includes("compliance-visibility")
  ) {
    claimsCautions.push(
      "Compliance claims must reference documented policy, not assertions"
    )
  }
  claimsCautions.push("No urgency CTAs permitted (e.g., 'act now', 'limited time', 'don't wait')")

  return {
    requiresVisibilityArchive: analysis.requiresVisibilityArchive,
    requiresApprovalWorkflow: analysis.requiresApprovalWorkflow,
    claimsCautions,
  }
}

function deriveContentThemes(analysis: IntakeAnalysis): string[] {
  const primaryThemes: Record<string, string[]> = {
    "program-launch": [
      "Program availability announcement",
      "What to expect from intake",
      "Meet the team / program overview",
      "How to get started",
      "Frequently asked questions",
      "Countdown / milestone moments",
    ],
    "referral-enablement": [
      "Referral pathway overview",
      "Who is appropriate for referral",
      "How to initiate a referral",
      "What happens after referral",
      "Provider FAQ",
      "Co-branding and partnership framing",
    ],
    "trust-building": [
      "Ongoing access reminders",
      "Community impact (non-outcome)",
      "Educational content on service area",
      "Stigma reduction language",
      "Staff and program spotlights",
      "Seasonal/evergreen awareness content",
      "Resource roundups",
    ],
    "compliance-visibility": [
      "Program milestone documentation",
      "Policy adherence narrative",
      "Board/stakeholder update framing",
      "Approval process overview",
      "Compliance archive snapshot",
      "Regulatory context framing",
    ],
  }
  const themes = new Set(primaryThemes[analysis.primaryArchetype] ?? [])
  if (analysis.secondaryArchetype && primaryThemes[analysis.secondaryArchetype]) {
    for (const theme of primaryThemes[analysis.secondaryArchetype]) {
      themes.add(theme)
    }
  }
  return Array.from(themes).slice(0, 8)
}

function deriveRequiredAssets(assets: string[]): RequiredAsset[] {
  return assets.map((asset) => {
    const lower = asset.toLowerCase()
    if (lower.includes("provider") || lower.includes("clinical") || lower.includes("referral")) {
      return { assetType: asset, owner: "Clinical communications lead" }
    }
    if (lower.includes("compliance") || lower.includes("legal") || lower.includes("approval")) {
      return { assetType: asset, owner: "Compliance officer" }
    }
    return { assetType: asset, owner: "Marketing lead" }
  })
}

function deriveSuccessSignals(analysis: IntakeAnalysis): string[] {
  const map: Record<string, string[]> = {
    "program-launch": [
      "Intake form submissions",
      "Landing page conversion rate",
      "Email open rate on launch sequence",
      "Social post reach (organic)",
      "Event attendance (if applicable)",
    ],
    "referral-enablement": [
      "Provider outreach response rate",
      "Referral form completion rate",
      "Provider portal logins",
      "One-pager downloads",
    ],
    "trust-building": [
      "Monthly follower growth",
      "Email list growth",
      "Content engagement rate",
      "Newsletter open rate",
      "Event RSVPs",
    ],
    "compliance-visibility": [
      "Archive document completion rate",
      "Stakeholder review completion",
      "Approval turnaround time",
    ],
  }

  const banned = [
    "clinical outcome",
    "recovery rate",
    "symptom reduction",
    "treatment success",
    "cure",
    "remission",
    "medical improvement",
  ]

  return (map[analysis.primaryArchetype] ?? []).filter((item) => {
    const lower = item.toLowerCase()
    return !banned.some((term) => lower.includes(term))
  })
}

function deriveConstraints(analysis: IntakeAnalysis): string[] {
  const constraints = [...CONSTRAINTS_BASE]
  if (analysis.requiresApprovalWorkflow) {
    constraints.push("All content requires documented sign-off before publication")
  }
  if (analysis.requiresVisibilityArchive) {
    constraints.push("All published content must be archived with datestamp and channel record")
  }
  if (analysis.detectedSignalKeys.includes("compliance")) {
    constraints.push("Health-adjacent claims must cite accessible source or remove claim")
  }
  return constraints
}

function buildCadenceFrequency(analysis: IntakeAnalysis): string {
  const cadence = analysis.cadenceRule
  if (cadence.pattern === "milestone-triggered") {
    return cadence.emailFrequency
  }
  const pieces = [cadence.emailFrequency, cadence.socialFrequency].filter(Boolean)
  return pieces.join("; ")
}

export function generateCampaignBrief(input: BriefGenerationInput): CampaignBrief {
  const { analysis, channels, assets, engineVersion, existingVersion } = input

  const rawPrimaryAudience = derivePrimaryAudience(analysis)
  const isLowClarity = analysis.stakeholdersClarityLevel === "low" || rawPrimaryAudience === "TBD"

  const primaryAudience = isLowClarity ? "TBD" : rawPrimaryAudience
  const missingInfoQuestions = isLowClarity
    ? analysis.missingInfoQuestions.map((question) => question.question)
    : null

  const metaAudienceWarning =
    analysis.stakeholdersClarityLevel === "medium"
      ? "Audience partially defined - review before publishing"
      : null

  const programSummary = sanitizeTextOrFallback(
    deriveProgramSummary(analysis),
    PROGRAM_SUMMARY_FALLBACK
  )

  const positioningStatement = sanitizeTextOrFallback(
    derivePositioning(analysis),
    POSITIONING_FALLBACK
  )

  const messagingPillars = sanitizePillars(deriveMessagingPillars(analysis))

  const complianceNotes = deriveComplianceNotes(analysis)
  const contentThemes = sanitizeArray(deriveContentThemes(analysis), ["Program overview"])
  const successSignals = sanitizeArray(deriveSuccessSignals(analysis), ["Engagement rate"])

  const brief: CampaignBrief = {
    title: `${archetypeLabel(analysis.primaryArchetype)} Campaign Brief`,
    programSummary,
    primaryAudience,
    secondaryAudience: deriveSecondaryAudience(analysis),
    positioningStatement,
    messagingPillars,
    toneProfile: deriveToneProfile(analysis.primaryArchetype),
    complianceNotes,
    channelPlan: channels.length > 0 ? channels : ["Social organic", "Email (monthly)"],
    cadencePlan: {
      frequency: buildCadenceFrequency(analysis),
      rationale: analysis.cadenceRule.rationale,
    },
    contentThemes,
    experimentPlan: analysis.experiments,
    requiredAssets: deriveRequiredAssets(assets),
    successSignals,
    constraints: deriveConstraints(analysis),
    missingInfoQuestions,
    meta: {
      engine_version: engineVersion,
      brief_version: incrementBriefVersion(existingVersion),
      generatedAt: new Date().toISOString(),
      confidenceScore: analysis.confidenceScore,
      stakeholdersClarityLevel: analysis.stakeholdersClarityLevel,
      audienceWarning: isLowClarity ? null : metaAudienceWarning,
    },
  }

  return brief
}
