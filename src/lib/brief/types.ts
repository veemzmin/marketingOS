import type { IntakeAnalysis, Experiment } from "@/lib/strategy/intake-engine"

export type ExperimentItem = Experiment

export type MessagingPillar = {
  pillar: string
  do: string[]
  avoid: string[]
}

export type ToneProfile = {
  calm: number
  upbeat: number
  formal: number
  tags: string[]
}

export type ComplianceNotes = {
  requiresVisibilityArchive: boolean
  requiresApprovalWorkflow: boolean
  claimsCautions: string[]
}

export type CadencePlan = {
  frequency: string
  rationale: string
}

export type RequiredAsset = {
  assetType: string
  owner: string
}

export type BriefMeta = {
  engine_version: string
  brief_version: string
  generatedAt: string
  confidenceScore: number
  stakeholdersClarityLevel: "high" | "medium" | "low"
  audienceWarning: string | null
}

export type CampaignBrief = {
  title: string
  programSummary: string
  primaryAudience: string | "TBD"
  secondaryAudience: string | null
  positioningStatement: string
  messagingPillars: MessagingPillar[]
  toneProfile: ToneProfile
  complianceNotes: ComplianceNotes
  channelPlan: string[]
  cadencePlan: CadencePlan
  contentThemes: string[]
  experimentPlan: ExperimentItem[]
  requiredAssets: RequiredAsset[]
  successSignals: string[]
  constraints: string[]
  missingInfoQuestions: string[] | null
  meta: BriefMeta
}

export type BriefGenerationInput = {
  analysis: IntakeAnalysis
  channels: string[]
  assets: string[]
  engineVersion: string
  existingVersion?: string
}
