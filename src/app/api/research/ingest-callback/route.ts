import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const N8N_CALLBACK_SECRET =
  process.env.MARKETING_OS_RESEARCH_CALLBACK_SECRET ||
  process.env.N8N_CALLBACK_SECRET

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (N8N_CALLBACK_SECRET && authHeader !== `Bearer ${N8N_CALLBACK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { organizationId, projectId, industry, sources } = body

    if (!organizationId || !projectId || !industry || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const category = `industry:${slugify(String(industry))}`

    const incoming = sources
      .map((source: { title?: string; summary?: string; url?: string; publisher?: string }) => {
        const claim = String(source.summary || source.title || '').trim()
        const ref = String(source.publisher || source.url || 'Unknown source').trim()
        if (!claim) return null
        return { claim, source: ref }
      })
      .filter(Boolean) as Array<{ claim: string; source: string }>

    if (incoming.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 })
    }

    const existing = await db.knowledgeEntry.findMany({
      where: {
        organizationId,
        category,
        claim: { in: incoming.map((item) => item.claim) },
      },
      select: { claim: true },
    })

    const existingClaims = new Set(existing.map((entry) => entry.claim))
    const toInsert = incoming.filter((item) => !existingClaims.has(item.claim))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 })
    }

    await db.knowledgeEntry.createMany({
      data: toInsert.map((item) => ({
        organizationId,
        category,
        claim: item.claim,
        source: item.source,
        lastVerified: new Date(),
      })),
    })

    return NextResponse.json({ success: true, inserted: toInsert.length })
  } catch (error) {
    logger.error('Research ingest callback failed:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
