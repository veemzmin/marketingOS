import { prisma } from "@/lib/db/client"
import type { Violation, PolicySeverity } from "./types"
import { validateMedicalClaims } from "./validators/medical-claims"
import { validateStigmaLanguage } from "./validators/stigma-language"
import { validateDSM5Terminology } from "./validators/dsm5-terminology"
import { validateTreatmentQualification } from "./validators/treatment-qualification"
import { validateSuicideSafety } from "./validators/suicide-safety"
import { validateConsentRequirement } from "./validators/consent-requirements"

export interface CustomPattern {
  id: string
  pattern: string
  explanation: string
  severity?: PolicySeverity
  flags?: string
}

export interface RequiredPhrase {
  id: string
  phrase: string
  explanation: string
  severity?: PolicySeverity
}

export interface GovernanceProfileConfig {
  enabledPolicies: string[]
  customPatterns?: CustomPattern[]
  requiredPhrases?: RequiredPhrase[]
}

export interface CampaignConfig {
  disabledPolicies?: string[]
  extraForbiddenPatterns?: CustomPattern[]
  requiredPhrases?: RequiredPhrase[]
}

export interface GovernanceContext {
  clientId?: string
  profileId?: string
  campaignId?: string
}

const POLICY_VALIDATORS: Record<string, (content: string) => Promise<Violation[]>> = {
  "medical-claims": validateMedicalClaims,
  "stigma-language": validateStigmaLanguage,
  "dsm5-terminology": validateDSM5Terminology,
  "treatment-qualification": validateTreatmentQualification,
  "suicide-safety": validateSuicideSafety,
  consent: validateConsentRequirement,
}

const DEFAULT_PROFILE_CONFIG: GovernanceProfileConfig = {
  enabledPolicies: Object.keys(POLICY_VALIDATORS),
}

function normalizeProfileConfig(
  raw: unknown
): GovernanceProfileConfig {
  const config = (raw || {}) as Partial<GovernanceProfileConfig>
  const enabledPolicies =
    config.enabledPolicies?.filter((id) => Boolean(POLICY_VALIDATORS[id])) ??
    DEFAULT_PROFILE_CONFIG.enabledPolicies

  return {
    enabledPolicies,
    customPatterns: config.customPatterns || [],
    requiredPhrases: config.requiredPhrases || [],
  }
}

function normalizeCampaignConfig(raw: unknown): CampaignConfig {
  const config = (raw || {}) as Partial<CampaignConfig>
  return {
    disabledPolicies: config.disabledPolicies || [],
    extraForbiddenPatterns: config.extraForbiddenPatterns || [],
    requiredPhrases: config.requiredPhrases || [],
  }
}

function validateCustomPatterns(
  content: string,
  patterns: CustomPattern[],
  policyId = "custom-patterns"
): Violation[] {
  const violations: Violation[] = []

  for (const pattern of patterns) {
    let regex: RegExp
    try {
      regex = new RegExp(pattern.pattern, pattern.flags || "gi")
    } catch (error) {
      console.warn(`Invalid custom pattern regex: ${pattern.id}`, error)
      continue
    }

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      violations.push({
        policyId,
        severity: pattern.severity || "medium",
        text: content.substring(
          Math.max(0, match.index - 20),
          Math.min(content.length, match.index + match[0].length + 20)
        ),
        explanation: pattern.explanation,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return violations
}

function validateRequiredPhrases(
  content: string,
  required: RequiredPhrase[]
): Violation[] {
  const violations: Violation[] = []
  const contentLower = content.toLowerCase()

  for (const requirement of required) {
    if (!contentLower.includes(requirement.phrase.toLowerCase())) {
      violations.push({
        policyId: "required-phrases",
        severity: requirement.severity || "medium",
        text: requirement.phrase,
        explanation: requirement.explanation,
        startIndex: 0,
        endIndex: 0,
      })
    }
  }

  return violations
}

export async function validateContentWithContext(
  content: string,
  context: GovernanceContext = {}
): Promise<{
  violations: Violation[]
  profileId?: string
  campaignId?: string
  clientId?: string
}> {
  let profileConfig = DEFAULT_PROFILE_CONFIG
  let campaignConfig: CampaignConfig | null = null
  let resolvedProfileId: string | undefined
  let resolvedCampaignId: string | undefined
  let resolvedClientId: string | undefined

  if (context.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: context.campaignId },
      include: {
        governanceProfile: true,
        client: { include: { truthPack: true } },
      },
    })
    if (campaign) {
      resolvedCampaignId = campaign.id
      resolvedProfileId = campaign.governanceProfileId
      resolvedClientId = campaign.clientId
      profileConfig = normalizeProfileConfig(campaign.governanceProfile.config)
      campaignConfig = normalizeCampaignConfig(campaign.config)
    }
  } else if (context.profileId) {
    const profile = await prisma.governanceProfile.findUnique({
      where: { id: context.profileId },
      include: { client: { include: { truthPack: true } } },
    })
    if (profile) {
      resolvedProfileId = profile.id
      resolvedClientId = profile.clientId
      profileConfig = normalizeProfileConfig(profile.config)
    }
  } else if (context.clientId) {
    const profile = await prisma.governanceProfile.findFirst({
      where: { clientId: context.clientId, isActive: true },
      orderBy: { updatedAt: "desc" },
    })
    if (profile) {
      resolvedProfileId = profile.id
      resolvedClientId = profile.clientId
      profileConfig = normalizeProfileConfig(profile.config)
    }
  }

  const disabledPolicies = new Set(campaignConfig?.disabledPolicies || [])
  const enabledPolicies = profileConfig.enabledPolicies.filter(
    (policyId) => !disabledPolicies.has(policyId)
  )

  const violations: Violation[] = []

  const validators = enabledPolicies
    .map((policyId) => POLICY_VALIDATORS[policyId])
    .filter(Boolean)

  const validatorResults = await Promise.all(
    validators.map((validator) => validator(content))
  )
  validatorResults.forEach((result) => violations.push(...result))

  if (profileConfig.customPatterns?.length) {
    violations.push(
      ...validateCustomPatterns(content, profileConfig.customPatterns)
    )
  }

  if (profileConfig.requiredPhrases?.length) {
    violations.push(
      ...validateRequiredPhrases(content, profileConfig.requiredPhrases)
    )
  }

  if (campaignConfig?.extraForbiddenPatterns?.length) {
    violations.push(
      ...validateCustomPatterns(
        content,
        campaignConfig.extraForbiddenPatterns,
        "custom-patterns"
      )
    )
  }

  if (campaignConfig?.requiredPhrases?.length) {
    violations.push(
      ...validateRequiredPhrases(content, campaignConfig.requiredPhrases)
    )
  }

  return {
    violations: violations.sort((a, b) => a.startIndex - b.startIndex),
    profileId: resolvedProfileId,
    campaignId: resolvedCampaignId,
    clientId: resolvedClientId,
  }
}
