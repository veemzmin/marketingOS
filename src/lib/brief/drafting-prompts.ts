import type { CampaignBrief } from "@/lib/brief/types"

export type DraftingPrompts = {
  promptA: string
  promptB: string | null
  promptC: string | null
}

const PROHIBITED_PATTERNS = [
  "will cure",
  "will treat your",
  "clinically proven",
  "guarantees results",
  "proven to reduce",
  "medical treatment for",
]

function resolvePrimaryAudience(audience: CampaignBrief["primaryAudience"]): string {
  if (audience === "TBD") {
    return "Audience not yet defined - treat as general community audience"
  }
  return audience
}

function joinList(values: string[], separator: string): string {
  return values.length > 0 ? values.join(separator) : ""
}

function buildContentThemeLines(themes: string[]): string {
  if (themes.length === 0) return "- General awareness"
  return themes.map((theme) => `- ${theme}`).join("\n")
}

function buildClaimsCautions(cautions: string[]): string {
  if (cautions.length === 0) return "- No additional cautions provided"
  return cautions.map((item) => `- ${item}`).join("\n")
}

function checkProhibited(prompt: string, label: "A" | "B" | "C"): void {
  const lower = prompt.toLowerCase()
  for (const pattern of PROHIBITED_PATTERNS) {
    if (lower.includes(pattern)) {
      throw new Error(
        `Prohibited clinical language detected in drafting prompt ${label}: ${pattern}. Review brief fields before generating prompts.`
      )
    }
  }
}

export function generateDraftingPrompts(
  brief: CampaignBrief,
  primaryArchetype: string,
  secondaryArchetype?: string
): DraftingPrompts {
  const isReferral =
    primaryArchetype === "referral-enablement" ||
    secondaryArchetype === "referral-enablement"
  const needsComplianceNarrative =
    brief.complianceNotes.requiresVisibilityArchive === true

  const promptA = `You are a behavioral health marketing strategist creating a charter-safe 2-week content micro-sequence.

Program: ${brief.programSummary}
Primary Audience: ${resolvePrimaryAudience(brief.primaryAudience)}
Channels: ${joinList(brief.channelPlan, ", ")}
Cadence: ${brief.cadencePlan.frequency}
Tone: ${joinList(brief.toneProfile.tags, ", ")}
Messaging Pillars: ${joinList(
    brief.messagingPillars.map((pillar) => pillar.pillar),
    ", "
  )}
Content Themes:
${buildContentThemeLines(brief.contentThemes)}

Create a 2-week post calendar. For each post provide:
- Day and channel
- Post copy (under 280 characters for social; under 150 words for long-form)
- Visual prompt (describe image/graphic in one sentence)
- Pillar alignment

Hard rules:
- No clinical outcomes or cure language
- No urgency CTAs ("act now", "limited time")
- No patient stories or testimonials unless explicitly unlocked
- No advice statements ("you should", "you need to")
- All claims must be scoped to availability and access, not efficacy`

  const promptB = isReferral
    ? `You are a healthcare communications specialist building a provider-facing referral enablement kit.

Program: ${brief.programSummary}
Provider Audience: ${brief.secondaryAudience ?? "Referring clinicians and care coordinators"}
Messaging Pillars: ${joinList(
        brief.messagingPillars.map((pillar) => pillar.pillar),
        ", "
      )}
Compliance Notes:
${buildClaimsCautions(brief.complianceNotes.claimsCautions)}

Create a provider enablement kit containing:
1. One-paragraph program description (clinical-safe, no outcomes promised)
2. Referral criteria overview (access requirements, not diagnostic criteria)
3. Three FAQ answers a provider might ask (availability, intake process, urgency protocol)
4. One "how to refer" step-by-step (3-5 steps)
5. One co-branded talking points card (5 bullet points, plain language)

Hard rules:
- Do not state clinical efficacy, cure rates, or recovery outcomes
- Do not include patient stories
- All language must be appropriate for a clinical handoff context
- Frame around access and process, not results`
    : null

  const promptC = needsComplianceNarrative
    ? `You are a compliance communications writer producing a visibility archive narrative.

Program: ${brief.programSummary}
Channels Used: ${joinList(brief.channelPlan, ", ")}
Cadence: ${brief.cadencePlan.frequency}
Claims Cautions:
${buildClaimsCautions(brief.complianceNotes.claimsCautions)}
Approval Workflow Required: ${brief.complianceNotes.requiresApprovalWorkflow ? "Yes" : "No"}

Write a compliance visibility snapshot narrative for internal records. Include:
1. Campaign purpose statement (1 paragraph, neutral)
2. Audience description (who will see this content and why)
3. Channel justification (why each channel was selected)
4. Claims inventory: list any health-adjacent claims and how each is scoped/qualified
5. Review pathway summary: describe the approval steps before publication
6. Archive statement: confirm content will be retained for [X] months per policy

Hard rules:
- Use plain, factual language - this is a compliance record, not marketing copy
- Do not add promotional framing
- If requiresApprovalWorkflow is true, explicitly name the required sign-off roles
- Flag any claims that require external clinical review`
    : null

  checkProhibited(promptA, "A")
  if (promptB) checkProhibited(promptB, "B")
  if (promptC) checkProhibited(promptC, "C")

  return {
    promptA,
    promptB,
    promptC,
  }
}
