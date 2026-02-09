/**
 * Governance Validation API Endpoint
 *
 * POST /api/governance/validate
 * Validates content against all governance policies and returns compliance score.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { validateContentWithContext } from '@/lib/governance/engine'
import { calculateComplianceScore } from '@/lib/governance/scoring/calculator'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentId, campaignId, profileId, clientId } = body as {
      content?: string
      contentId?: string
      campaignId?: string
      profileId?: string
      clientId?: string
    }

    // Validate request
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (content.length > 50000) {
      return NextResponse.json({ error: 'Content too large (max 50000 characters)' }, { status: 400 })
    }

    // Run validation
    const { violations, profileId: resolvedProfileId, campaignId: resolvedCampaignId, clientId: resolvedClientId } =
      await validateContentWithContext(content, { campaignId, profileId, clientId })
    const complianceScore = calculateComplianceScore(violations)

    const session = await auth()
    const tenantId = request.headers.get('x-tenant-id')
    if (session?.user?.id && tenantId) {
      await logAudit({
        organizationId: tenantId,
        userId: session.user.id,
        action: 'governance-validation',
        resource: 'content',
        resourceId: contentId || 'test',
        changes: {
          complianceScore: complianceScore.score,
          violationCount: violations.length,
          policies: violations.map(v => v.policyId),
        },
        metadata: {
          campaignId,
          profileId,
          clientId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      complianceScore: complianceScore.score,
      context: {
        profileId: resolvedProfileId,
        campaignId: resolvedCampaignId,
        clientId: resolvedClientId,
      },
      violations: violations.map(v => ({
        policyId: v.policyId,
        severity: v.severity,
        text: v.text,
        explanation: v.explanation,
        startIndex: v.startIndex,
        endIndex: v.endIndex,
      })),
      reasoning: complianceScore.reasoning,
      passed: complianceScore.passed,
    })
  } catch (error) {
    logger.error('Validation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Validation service error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
