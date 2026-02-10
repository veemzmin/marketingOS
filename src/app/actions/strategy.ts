"use server"

type StrategyRecommendation = {
  summary: string
  recommendedCadence: string
  channels: string[]
  experiments: string[]
  assets: string[]
  nextSteps: string[]
  risks: string[]
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ")
}

export async function analyzeStrategyAction(
  _prevState: StrategyRecommendation | null,
  formData: FormData
): Promise<StrategyRecommendation> {
  const rawText = String(formData.get("intakeText") || "")
  const industry = String(formData.get("industry") || "").trim()
  const goals = String(formData.get("goals") || "").trim()
  const preferredCadence = String(formData.get("cadence") || "").trim()
  const audience = String(formData.get("audience") || "").trim()

  const text = rawText.toLowerCase()
  const mentionsSocial = includesAny(text, ["social", "post", "posts", "instagram", "facebook", "linkedin"])
  const mentionsFlyer = includesAny(text, ["flyer", "print", "one-pager"])
  const mentionsEmail = includesAny(text, ["email", "newsletter", "drip", "nurture"])
  const mentionsCompliance = includesAny(text, ["state", "compliance", "regulated", "review"])
  const mentionsHealthcare = includesAny(text, ["medical", "health", "sud", "substance", "mental"])
  const mentionsLaunch = includesAny(text, ["start", "launch", "rollout", "new year"])

  const channels = new Set<string>()
  const assets = new Set<string>()
  const experiments: string[] = []
  const risks: string[] = []

  if (mentionsSocial) {
    channels.add("Social organic (short-form + carousel)")
    channels.add("Paid social pilot (2 audiences)")
    assets.add("15–20 social posts (4-6 week bank)")
  }

  if (mentionsFlyer) {
    channels.add("Print/one-pager distribution")
    assets.add("Program flyer + intake checklist")
  }

  if (mentionsEmail || mentionsLaunch) {
    channels.add("Email nurture / drip")
    assets.add("Email sequence (4–6 touches)")
  }

  if (mentionsHealthcare) {
    assets.add("Clinical explainer page (what it is / who it helps)")
    risks.add("Ensure claims are qualified and compliant")
  }

  if (mentionsCompliance) {
    risks.add("Approval workflow required before publishing")
  }

  if (channels.size === 0) {
    channels.add("Social organic")
    channels.add("Email nurture")
    assets.add("Starter content pack (10 posts + 3 emails)")
  }

  experiments.push(
    "A/B test hooks: outcome-focused vs. integration-focused",
    "A/B test CTA: call now vs. book assessment",
    "A/B test creative: clinician-led vs. patient-story"
  )

  const cadence =
    preferredCadence ||
    (mentionsLaunch
      ? "Launch: daily social for 7 days, then 3x/week; 1 email/week for 4–6 weeks."
      : "Baseline: 3x/week social + 1 email/week.")

  const summaryParts: string[] = []
  if (industry) summaryParts.push(`${titleCase(industry)} focus`)
  if (audience) summaryParts.push(`Primary audience: ${audience}`)
  if (goals) summaryParts.push(`Goals: ${goals}`)

  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" • ")
      : "Campaign intake analyzed. Recommended a multi-touch program with social, email, and conversion assets."

  const nextSteps = [
    "Turn intake into a campaign brief + messaging pillars",
    "Draft 4–6 week content calendar",
    "Create landing page + lead capture",
    "Run 2-week pilot and review performance",
  ]

  return {
    summary,
    recommendedCadence: cadence,
    channels: Array.from(channels),
    experiments,
    assets: Array.from(assets),
    nextSteps,
    risks,
  }
}
