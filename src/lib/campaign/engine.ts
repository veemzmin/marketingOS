import { prisma } from "@/lib/db/client"
import { buildGovernedPrompt, type PromptContext } from "@/lib/ai/prompt-builder"

export interface CampaignTemplate {
  id: string
  name: string
  contentType: "blog" | "social"
  platform?: "instagram" | "facebook" | "linkedin" | "twitter"
  titleTemplate?: string
  bodyTemplate: string
  instructions?: string
}

export interface CampaignConfig {
  templates?: CampaignTemplate[]
  defaultTemplateId?: string
}

export async function getCampaignTemplates(
  campaignId: string
): Promise<CampaignTemplate[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { config: true },
  })

  if (!campaign) {
    return []
  }

  const config = (campaign.config || {}) as CampaignConfig
  return Array.isArray(config.templates) ? config.templates : []
}

function resolveTemplate(
  config: CampaignConfig,
  templateId?: string
): CampaignTemplate | null {
  const templates = Array.isArray(config.templates) ? config.templates : []
  if (templates.length === 0) {
    return null
  }

  if (templateId) {
    const match = templates.find((t) => t.id === templateId)
    if (match) return match
  }

  if (config.defaultTemplateId) {
    const match = templates.find((t) => t.id === config.defaultTemplateId)
    if (match) return match
  }

  return templates[0]
}

export async function buildCampaignPrompt(params: {
  campaignId: string
  templateId?: string
  context: PromptContext
}): Promise<{ prompt: string; template: CampaignTemplate | null }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      client: { include: { truthPack: true } },
    },
  })

  if (!campaign) {
    throw new Error("Campaign not found")
  }

  const config = (campaign.config || {}) as CampaignConfig
  const template = resolveTemplate(config, params.templateId)

  const basePrompt = buildGovernedPrompt(params.context)
  const truthPackSummary = campaign.client.truthPack?.data
    ? JSON.stringify(campaign.client.truthPack.data)
    : "No truth pack available."

  const templateBlock = template
    ? `\n\nTEMPLATE INSTRUCTIONS:\n- Template: ${template.name}\n- Content type: ${template.contentType}${
        template.platform ? ` (${template.platform})` : ""
      }\n- Title template: ${template.titleTemplate || "N/A"}\n- Body template:\n${template.bodyTemplate}\n${
        template.instructions ? `\nAdditional guidance:\n${template.instructions}` : ""
      }`
    : "\n\nTEMPLATE INSTRUCTIONS:\nNo campaign templates configured."

  const campaignBlock = `\n\nCAMPAIGN CONTEXT:\n- Campaign: ${campaign.name}\n- Status: ${campaign.status}\n- Client: ${campaign.client.name}\n- Truth Pack (JSON): ${truthPackSummary}`

  return {
    prompt: `${basePrompt}${campaignBlock}${templateBlock}`.trim(),
    template,
  }
}
