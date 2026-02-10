"use server"

import {
  analyzeIntake,
  type IntakeAnalysis,
} from "@/lib/strategy/intake-engine"

export type StrategyRecommendation = {
  analysis: IntakeAnalysis
  summary: string
  primaryArchetype: string
  secondaryArchetype?: string
  recommendedCadence: string
  cadenceRationale: string
  channels: string[]
  experiments: Array<{ id: string; name: string; safetyClass: string }>
  assets: string[]
  nextSteps: string[]
  risks: string[]
  missingInfoQuestions: string[]
  requiresVisibilityArchive: boolean
  requiresApprovalWorkflow: boolean
  confidenceScore: number
  evidence: Partial<Record<string, string[]>>
  stakeholdersClarityLevel: "high" | "medium" | "low"
  stack: string[]
  detectedSignalKeys: string[]
  plannerPrompt: string
  suggestedAudience: string[]
  suggestedGoals: string[]
  suggestedCadence: string[]
}

// Map engine analysis to the shape the UI consumes.
function toRecommendation(
  analysis: IntakeAnalysis,
  industry: string,
  audience: string,
  goals: string
): StrategyRecommendation {
  const { cadenceRule } = analysis

  const signalSet = new Set(analysis.detectedSignalKeys)

  // Archetype-first channel defaults (Item 10)
  const ARCHETYPE_DEFAULT_CHANNELS: Record<string, string[]> = {
    "program-launch": ["Email sequence", "Social organic"],
    "referral-enablement": ["Provider email drip", "LinkedIn organic"],
    "trust-building": ["Social organic", "Email (monthly)"],
    "compliance-visibility": [
      "Stakeholder email (milestone-triggered)",
      "Documentation archive",
    ],
  }

  const channels: string[] = [
    ...(ARCHETYPE_DEFAULT_CHANNELS[analysis.primaryArchetype] ?? [
      "Social organic",
      "Email (monthly)",
    ]),
  ]

  if (signalSet.has("flyer") && !channels.some((c) => c.toLowerCase().startsWith("print"))) {
    channels.push("Print / one-pager distribution")
  }

  // Dedup channels: normalize to lowercase prefix match (Item 11)
  const deduplicatedChannels = channels.filter((ch, idx) => {
    const normalized = ch.toLowerCase().replace(/[.,;]$/, "")
    return !channels.slice(0, idx).some((prev) => {
      const prevNorm = prev.toLowerCase().replace(/[.,;]$/, "")
      return (
        prevNorm.startsWith(normalized.slice(0, 12)) ||
        normalized.startsWith(prevNorm.slice(0, 12))
      )
    })
  })

  // Derive suggested assets from archetype + signals
  const assets: string[] = []
  if (analysis.primaryArchetype === "program-launch") {
    assets.push(
      "Program overview page (what it is, who it supports, how to connect)",
      "Email sequence: 4-6 touches (pre-launch awareness + post-launch follow-up)",
      "15-20 social posts (6-week bank)"
    )
  }
  if (analysis.primaryArchetype === "referral-enablement") {
    assets.push(
      "Provider one-pager or referral checklist",
      "Provider email drip: 5-7 touches over 6-8 weeks",
      "LinkedIn post series (clinical education focus)"
    )
  }
  if (analysis.primaryArchetype === "trust-building") {
    assets.push(
      "Educational content series (3-4 topic clusters)",
      "Monthly newsletter template",
      "Social post bank (3x/week, 8-week supply)"
    )
  }
  if (analysis.primaryArchetype === "compliance-visibility") {
    assets.push(
      "Milestone communication templates (accreditation / annual report)",
      "Stakeholder one-pager (milestone summary, no clinical claims)",
      "Approval workflow checklist"
    )
  }
  if (signalSet.has("flyer")) {
    assets.push("Print flyer / handout (provider-facing or community-facing)")
  }

  // Dedup assets: exact string dedup only (Item 11)
  const deduplicatedAssets = [...new Set(assets)]

  // Next steps are archetype-aware and non-prescriptive
  const nextSteps = [
    "Complete any missing intake information (see questions below) before finalizing brief",
    "Turn intake into a campaign brief with messaging pillars (no outcome claims)",
    "Draft 4-6 week content calendar aligned to cadence pattern",
    ...(analysis.requiresApprovalWorkflow
      ? ["Map approval checkpoints before scheduling any content"]
      : []),
    "Run 2-week pilot on primary channel; review engagement signals before scaling",
  ]

  const risks: string[] = []
  if (analysis.stakeholdersClarityLevel === "low") {
    risks.push("Audience unclear - review MIQ-01")
  }
  if (analysis.requiresApprovalWorkflow) {
    risks.push("Approval workflow required - schedule review gates before any publish date")
  }
  // Claims warning triggers on any healthcare-related signal (Item 9)
  const CLAIMS_TRIGGER_SIGNALS = [
    "launch",
    "compliance",
    "referral-enablement",
    "integration-of-care",
  ]
  if (CLAIMS_TRIGGER_SIGNALS.some((s) => signalSet.has(s as any))) {
    risks.push("Confirm all program claims are qualified and do not imply clinical outcomes")
  }
  if (signalSet.has("trust-building")) {
    risks.push("Avoid any framing that implies urgency or pressure to seek care")
  }

  const cadenceLabel =
    cadenceRule.pattern === "hybrid"
      ? `Hybrid — ${cadenceRule.emailFrequency} email / ${cadenceRule.socialFrequency} social`
      : cadenceRule.pattern === "weekly-anchor"
        ? `Weekly anchor — ${cadenceRule.socialFrequency} social / ${cadenceRule.emailFrequency} email`
        : cadenceRule.pattern === "drip"
          ? `Drip — ${cadenceRule.emailFrequency} email / ${cadenceRule.socialFrequency} social`
          : `Milestone-triggered — ${cadenceRule.emailFrequency}`

  const summaryParts: string[] = []
  if (industry) summaryParts.push(industry)
  if (audience) summaryParts.push(`Audience: ${audience}`)
  if (goals) summaryParts.push(`Goals: ${goals}`)
  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" • ")
      : `Archetype: ${analysis.primaryArchetype} — ${analysis.detectedSignalKeys.join(", ") || "general awareness"}`


  return {
    analysis,
    summary,
    primaryArchetype: analysis.primaryArchetype,
    secondaryArchetype: analysis.secondaryArchetype,
    recommendedCadence: cadenceLabel,
    cadenceRationale: cadenceRule.rationale,
    channels: deduplicatedChannels,
    experiments: analysis.experiments.map((e) => ({
      id: e.id,
      name: e.name,
      safetyClass: e.safetyClass,
    })),
    assets: deduplicatedAssets,
    nextSteps,
    risks,
    missingInfoQuestions: analysis.missingInfoQuestions.map((q) => q.question),
    requiresVisibilityArchive: analysis.requiresVisibilityArchive,
    requiresApprovalWorkflow: analysis.requiresApprovalWorkflow,
    confidenceScore: analysis.confidenceScore,
    evidence: analysis.evidence,
    stakeholdersClarityLevel: analysis.stakeholdersClarityLevel,
    stack: analysis.stack,
    detectedSignalKeys: analysis.detectedSignalKeys,
    plannerPrompt: analysis.plannerPrompt,
    suggestedAudience: analysis.suggestedAudience,
    suggestedGoals: analysis.suggestedGoals,
    suggestedCadence: analysis.suggestedCadence,
  }
}

export async function analyzeStrategyAction(
  _prevState: StrategyRecommendation | null,
  formData: FormData
): Promise<StrategyRecommendation> {
  const intakeText = String(formData.get("intakeText") || "")
  const ideasText = String(formData.get("ideasText") || "")
  const industry = String(formData.get("industry") || "").trim()
  const goals = String(formData.get("goals") || "").trim()
  const audience = String(formData.get("audience") || "").trim()

  const analysis = analyzeIntake({
    intakeText,
    ideasText,
    industry,
    audience,
    goals,
  })

  return toRecommendation(analysis, industry, audience, goals)
}
