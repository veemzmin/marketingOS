/**
 * Governance Validation API Endpoint
 *
 * POST /api/governance/validate
 * Validates content against all governance policies and returns compliance score.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateContent } from '@/lib/governance/validators/composite'
import { calculateComplianceScore } from '@/lib/governance/scoring/calculator'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentId } = body as { content?: string; contentId?: string }

    // Validate request
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (content.length > 50000) {
      return NextResponse.json({ error: 'Content too large (max 50000 characters)' }, { status: 400 })
    }

    // Run validation
    const violations = await validateContent(content)
    const complianceScore = calculateComplianceScore(violations)

    // TODO: Re-enable authentication and audit logging after Phase 2 testing
    // const session = await auth()
    // if (session?.user?.organizationId) {
    //   await prisma.auditLog.create({
    //     data: {
    //       organizationId: session.user.organizationId,
    //       userId: session.user.id,
    //       action: 'governance-validation',
    //       resource: 'content',
    //       resourceId: contentId || 'test',
    //       changes: {
    //         complianceScore: complianceScore.score,
    //         violationCount: violations.length,
    //         policies: violations.map(v => v.policyId),
    //       },
    //     },
    //   })
    // }

    return NextResponse.json({
      success: true,
      complianceScore: complianceScore.score,
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
    console.error('Validation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Validation service error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
