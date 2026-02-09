'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { headers } from 'next/headers'
import { getRelevantFacts } from '@/lib/ai/knowledge-base'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

const TEAM_ROLES = [
  {
    role: 'Market Research Analyst',
    focus: 'Market sizing, demand signals, and competitive benchmarks.',
  },
  {
    role: 'Brand Strategist',
    focus: 'Positioning, narrative, and differentiation angles.',
  },
  {
    role: 'Creative Director',
    focus: 'Campaign concepts, creative hooks, and virality mechanics.',
  },
  {
    role: 'Growth Marketing Lead',
    focus: 'Channel strategy, experimentation roadmap, and conversion lifts.',
  },
]

type ResearchOutputPayload = {
  outputType:
    | 'EXEC_SUMMARY'
    | 'FULL_REPORT'
    | 'SLIDE_OUTLINE'
    | 'DATA_APPENDIX'
    | 'ACTION_PLAN'
    | 'IDEAS'
  content: string
}

const N8N_RESEARCH_WEBHOOK_URL = process.env.N8N_RESEARCH_WEBHOOK_URL
const MARKETING_OS_RESEARCH_CALLBACK_URL =
  process.env.MARKETING_OS_RESEARCH_CALLBACK_URL ||
  (process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/research/ingest-callback`
    : undefined)

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'over', 'under',
  'your', 'our', 'their', 'they', 'them', 'about', 'which', 'will', 'would',
  'could', 'should', 'there', 'where', 'what', 'when', 'who', 'why', 'how',
  'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'as', 'is', 'are', 'be', 'it',
  'we', 'us', 'you', 'i', 'me', 'my', 'our', 'ours', 'their', 'theirs',
])

function extractKeywords(text: string, limit: number = 8): string[] {
  if (!text) return []
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token))

  const unique = Array.from(new Set(tokens))
  return unique.slice(0, limit)
}

function buildQuestions(prompt: string): string[] {
  const baseQuestions = [
    'What business outcome and KPI define success for this research?',
    'Which customer segment or geography should be prioritized first?',
    'Any brand constraints, regulatory limits, or competitive exclusions we must honor?',
    'Preferred channels, budget guardrails, or launch window to align with?',
  ]

  if (prompt.toLowerCase().includes('launch')) {
    baseQuestions.push('What is the target launch date and key milestones?')
  }

  return baseQuestions
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildSources({
  project,
  facts,
}: {
  project: { title: string; industry: string; description: string | null }
  facts: Array<{ claim: string; source: string }>
}) {
  const sources: Array<{
    title: string
    url?: string | null
    publisher?: string | null
    sourceType: string
    summary?: string | null
  }> = []

  const internalSummary = project.description
    ? project.description
    : `Internal context for ${project.industry} research.`

  sources.push({
    title: `${project.industry} Industry Profile (Internal)`,
    publisher: 'Marketing OS',
    sourceType: 'industry-profile',
    summary: internalSummary,
  })

  facts.forEach((fact) => {
    sources.push({
      title: fact.claim.slice(0, 120),
      publisher: fact.source,
      sourceType: 'knowledge-base',
      summary: fact.claim,
    })
  })

  if (sources.length === 0) {
    sources.push({
      title: 'Internal Working Assumptions',
      publisher: 'Marketing OS',
      sourceType: 'assumption',
      summary: 'No verified sources were available for this run.',
    })
  }

  return sources
}

function buildOutputs({
  project,
  prompt,
  sources,
  answers,
  facts,
}: {
  project: { title: string; industry: string }
  prompt: string
  sources: Array<{ title: string }>
  answers: Array<{ question: string; answer: string }>
  facts: Array<{ claim: string }>
}): ResearchOutputPayload[] {
  const citations = sources.map((_, index) => `[${index + 1}]`)
  const primaryCitation = citations[0] || '[1]'
  const factCitations = citations.slice(1).length > 0 ? citations.slice(1) : [primaryCitation]
  const highlightedFacts = facts.slice(0, 3).map((fact, index) => {
    const citation = factCitations[index] || primaryCitation
    return `- ${fact.claim} ${citation}`
  })

  const answerBlock = answers.length
    ? answers
        .map((item) => `- ${item.question}\n  Response: ${item.answer || 'Pending input.'}`)
        .join('\n')
    : '- No clarifying answers provided yet.'

  const executiveSummary = [
    `Research focus: ${project.title} (${project.industry}).`,
    `Primary objective: ${prompt}. ${primaryCitation}`,
    `Top demand signals and industry benchmarks need verification against the latest data. ${primaryCitation}`,
    `Positioning should emphasize credible expertise and measurable outcomes. ${primaryCitation}`,
    `Execution requires a 30/60/90-day launch plan tied to core KPIs. ${primaryCitation}`,
  ]
    .map((line) => `- ${line}`)
    .join('\n')

  const fullReport = [
    `MARKET SNAPSHOT\n${primaryCitation}\n- Industry focus: ${project.industry}.\n- Goal: ${prompt}.\n- Research assumptions documented in sources.`,
    `AUDIENCE AND DEMAND\n${highlightedFacts.length ? highlightedFacts.join('\n') : `- Capture current audience pain points and intent signals. ${primaryCitation}`}`,
    `COMPETITIVE LANDSCAPE\n- Map top 5 competitors by messaging, offers, and channel mix. ${primaryCitation}\n- Identify whitespace opportunities. ${primaryCitation}`,
    `POSITIONING AND STORY\n- Core narrative: credible, outcome-driven, and culturally aligned. ${primaryCitation}\n- Proof points should reference verified claims. ${primaryCitation}`,
    `RISKS AND COMPLIANCE\n- Validate regulatory, platform, and brand constraints early. ${primaryCitation}\n- Maintain safety and accuracy review loop. ${primaryCitation}`,
    `GO-TO-MARKET HYPOTHESES\n- Pilot 3 channel bets with measurable KPI targets. ${primaryCitation}\n- Iterate weekly based on leading indicators. ${primaryCitation}`,
    `CLARIFYING INPUTS\n${answerBlock}`,
  ].join('\n\n')

  const slideOutline = [
    `1. Executive summary (${project.industry} market opportunity) ${primaryCitation}`,
    `2. Business objective and KPI targets ${primaryCitation}`,
    `3. Audience segmentation and demand signals ${primaryCitation}`,
    `4. Competitive landscape and whitespace ${primaryCitation}`,
    `5. Positioning and messaging architecture ${primaryCitation}`,
    `6. Creative platform + campaign hooks ${primaryCitation}`,
    `7. Channel strategy and budget allocation ${primaryCitation}`,
    `8. 30/60/90-day action plan ${primaryCitation}`,
    `9. Risks, compliance, and governance ${primaryCitation}`,
    `10. Success metrics and reporting cadence ${primaryCitation}`,
  ].join('\n')

  const dataAppendix = [
    `- Market size, TAM/SAM/SOM benchmarks ${primaryCitation}`,
    `- Audience intent keywords and search volume ${primaryCitation}`,
    `- Channel CPC/CPM/CPA benchmarks by platform ${primaryCitation}`,
    `- Competitor messaging matrix and offer audit ${primaryCitation}`,
    `- Regulatory constraints checklist for ${project.industry} ${primaryCitation}`,
    `- KPI dashboard blueprint and reporting cadence ${primaryCitation}`,
  ].join('\n')

  const actionPlan = [
    '30 DAYS',
    '- Confirm research brief, KPIs, and primary persona definitions.',
    '- Collect competitive messaging and offer benchmarks.',
    '- Build content and channel test plan with success thresholds.',
    '60 DAYS',
    '- Launch pilot campaigns across top 2 channels with rapid feedback loops.',
    '- Validate messaging, creative hooks, and conversion performance.',
    '- Expand knowledge base entries with verified sources.',
    '90 DAYS',
    '- Scale winning concepts and retire low-performing angles.',
    '- Build always-on reporting and governance reviews.',
    '- Plan next-quarter growth experiments and creative refresh.',
  ].join('\n')

  const ideaLines = TEAM_ROLES.flatMap((role, index) => {
    const citation = citations[index] || primaryCitation
    return [
      `${role.role}: ${role.focus}`,
      `- Idea 1: Viral-ready insight-led content series tailored to ${project.industry}. ${citation}`,
      `- Idea 2: Social proof campaign anchored by measurable outcomes and partner voices. ${citation}`,
    ]
  }).join('\n')

  return [
    {
      outputType: 'EXEC_SUMMARY',
      content: executiveSummary,
    },
    {
      outputType: 'FULL_REPORT',
      content: fullReport,
    },
    {
      outputType: 'SLIDE_OUTLINE',
      content: slideOutline,
    },
    {
      outputType: 'DATA_APPENDIX',
      content: dataAppendix,
    },
    {
      outputType: 'ACTION_PLAN',
      content: actionPlan,
    },
    {
      outputType: 'IDEAS',
      content: ideaLines,
    },
  ]
}

async function resolveOrganizationId(userId: string | undefined | null) {
  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!organizationId && userId) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId },
      select: { organizationId: true },
    })
    organizationId = userOrg?.organizationId || null
  }

  return organizationId
}

export async function createResearchProjectAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return
  }

  const organizationId = await resolveOrganizationId(session.user.id)
  if (!organizationId) {
    return
  }

  const title = String(formData.get('projectTitle') || '').trim()
  const industry = String(formData.get('projectIndustry') || '').trim()
  const description = String(formData.get('projectDescription') || '').trim()

  if (!title || !industry) {
    return
  }

  const project = await prisma.researchProject.create({
    data: {
      organizationId,
      title,
      industry,
      description: description || null,
      createdByUserId: session.user.id,
    },
  })

  revalidatePath('/dashboard/research')
  redirect(`/dashboard/research?projectId=${project.id}`)
}

export async function startResearchRunAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return
  }

  const organizationId = await resolveOrganizationId(session.user.id)
  if (!organizationId) {
    return
  }

  const projectId = String(formData.get('projectId') || '').trim()
  const prompt = String(formData.get('prompt') || '').trim()

  if (!projectId || !prompt) {
    return
  }

  const project = await prisma.researchProject.findUnique({
    where: { id: projectId, organizationId },
  })

  if (!project) {
    return
  }

  const questions = buildQuestions(prompt)

  const run = await prisma.researchRun.create({
    data: {
      projectId,
      prompt,
      status: 'PENDING',
      questions,
    },
  })

  revalidatePath('/dashboard/research')
  redirect(`/dashboard/research?runId=${run.id}&projectId=${projectId}`)
}

export async function completeResearchRunAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return
  }

  const organizationId = await resolveOrganizationId(session.user.id)
  if (!organizationId) {
    return
  }

  const runId = String(formData.get('runId') || '').trim()
  if (!runId) {
    return
  }

  const run = await prisma.researchRun.findUnique({
    where: { id: runId },
    include: { project: true },
  })

  if (!run || run.project.organizationId !== organizationId) {
    return
  }

  const questions = Array.isArray(run.questions) ? (run.questions as string[]) : []
  const answers = questions.map((question, index) => {
    const response = String(formData.get(`answer-${index}`) || '').trim()
    return { question, answer: response }
  })

  const keywords = extractKeywords(`${run.prompt} ${run.project.industry} ${run.project.title}`)
  const facts = await getRelevantFacts(organizationId, keywords, 6)

  const sources = buildSources({ project: run.project, facts })
  const outputs = buildOutputs({
    project: run.project,
    prompt: run.prompt,
    sources,
    answers,
    facts,
  })

  try {
    await prisma.$transaction(async (tx) => {
      await tx.researchSource.deleteMany({ where: { runId } })
      await tx.researchOutput.deleteMany({ where: { runId } })

      if (sources.length > 0) {
        await tx.researchSource.createMany({
          data: sources.map((source) => ({
            runId,
            title: source.title,
            url: source.url || null,
            publisher: source.publisher || null,
            sourceType: source.sourceType,
            summary: source.summary || null,
          })),
        })
      }

      if (outputs.length > 0) {
        await tx.researchOutput.createMany({
          data: outputs.map((output) => ({
            runId,
            outputType: output.outputType,
            content: output.content,
          })),
        })
      }

      await tx.researchRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          answers,
          completedAt: new Date(),
        },
      })
    })
  } catch (error) {
    logger.error('Failed to complete research run:', error)
    await prisma.researchRun.update({
      where: { id: runId },
      data: { status: 'FAILED' },
    })
  }

  revalidatePath('/dashboard/research')
  redirect(`/dashboard/research?runId=${runId}&projectId=${run.projectId}`)
}

export async function refreshResearchSourcesAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return
  }

  if (!N8N_RESEARCH_WEBHOOK_URL || !MARKETING_OS_RESEARCH_CALLBACK_URL) {
    logger.error('N8N research webhook or callback URL not configured.')
    return
  }

  const organizationId = await resolveOrganizationId(session.user.id)
  if (!organizationId) {
    return
  }

  const projectId = String(formData.get('projectId') || '').trim()
  if (!projectId) {
    return
  }

  const project = await prisma.researchProject.findUnique({
    where: { id: projectId, organizationId },
  })

  if (!project) {
    return
  }

  const latestRun = await prisma.researchRun.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  const keywords = extractKeywords(
    `${project.title} ${project.industry} ${latestRun?.prompt || ''}`
  )

  const payload = {
    organizationId,
    projectId,
    industry: project.industry,
    industrySlug: slugify(project.industry),
    projectTitle: project.title,
    prompt: latestRun?.prompt || '',
    keywords,
    callbackUrl: MARKETING_OS_RESEARCH_CALLBACK_URL,
  }

  try {
    const response = await fetch(N8N_RESEARCH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      logger.error('Failed to trigger research ingest:', response.statusText)
    }
  } catch (error) {
    logger.error('Error triggering research ingest:', error)
  }

  revalidatePath('/dashboard/research')
  redirect(`/dashboard/research?projectId=${projectId}`)
}
