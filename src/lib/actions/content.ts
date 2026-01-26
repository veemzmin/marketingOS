'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { headers } from 'next/headers'
import { validateContent } from '@/lib/governance/validators/composite'
import { calculateComplianceScore } from '@/lib/governance/scoring/calculator'
import { contentFormSchema, type ContentFormData } from '@/lib/validators/content-schema'
import { canTransitionTo } from '@/lib/content/types'
import { shouldCreateVersion } from '@/lib/content/helpers'

export async function saveDraftAction({
  contentId,
  formData,
}: {
  contentId?: string
  formData: ContentFormData
}) {
  const session = await auth()
  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // If no tenant ID in header, get user's first organization
  if (!organizationId) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (!userOrg) {
      return { success: false, error: 'No organization found' }
    }
    organizationId = userOrg.organizationId
  }

  // Validate form data
  const parsed = contentFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data', issues: parsed.error.issues }
  }

  const { title, body, topic, audience, tone } = parsed.data

  // Run governance validation
  const violations = await validateContent(body)
  const { score } = calculateComplianceScore(violations)

  try {
    if (!contentId) {
      // Create new draft
      const content = await prisma.content.create({
        data: {
          organizationId,
          createdByUserId: session.user.id,
          title,
          status: 'DRAFT',
          complianceScore: score,
          versions: {
            create: {
              versionNumber: 1,
              title,
              body,
              topic,
              audience,
              tone,
              complianceScore: score,
              createdByUserId: session.user.id,
            },
          },
        },
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      })
      return { success: true, contentId: content.id, complianceScore: score }
    } else {
      // Update existing draft
      const content = await prisma.content.findUnique({
        where: { id: contentId, organizationId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      })

      if (!content) {
        return { success: false, error: 'Content not found' }
      }

      if (content.status !== 'DRAFT') {
        return { success: false, error: 'Can only edit draft content' }
      }

      // Check if content actually changed
      const shouldCreate = await shouldCreateVersion(contentId, body)
      if (!shouldCreate) {
        return { success: true, contentId, skipped: true }
      }

      // Create new version
      const latestVersion = content.versions[0]
      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

      await prisma.content.update({
        where: { id: contentId },
        data: {
          title,
          complianceScore: score,
          versions: {
            create: {
              versionNumber: newVersionNumber,
              title,
              body,
              topic,
              audience,
              tone,
              complianceScore: score,
              createdByUserId: session.user.id,
            },
          },
        },
      })

      return { success: true, contentId, complianceScore: score }
    }
  } catch (error) {
    console.error('Save draft failed:', error)
    return { success: false, error: 'Failed to save draft' }
  }
}

export async function validateGovernanceAction(content: string) {
  // Wrapper for real-time UI validation (no auth required for read-only validation)
  const violations = await validateContent(content)
  const { score } = calculateComplianceScore(violations)

  return { violations, complianceScore: score }
}

export async function submitContentAction({ contentId }: { contentId: string }) {
  const session = await auth()
  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // If no tenant ID in header, get user's first organization
  if (!organizationId) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (!userOrg) {
      return { success: false, error: 'No organization found' }
    }
    organizationId = userOrg.organizationId
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId, organizationId },
  })

  if (!content) {
    return { success: false, error: 'Content not found' }
  }

  // Validate status transition
  if (!canTransitionTo(content.status as any, 'SUBMITTED')) {
    return { success: false, error: `Cannot submit content in ${content.status} status` }
  }

  // Update status
  await prisma.content.update({
    where: { id: contentId },
    data: { status: 'SUBMITTED' },
  })

  return { success: true }
}

export async function listContentAction({ status }: { status?: string } = {}) {
  const session = await auth()
  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', contents: [] }
  }

  // If no tenant ID in header, get user's first organization
  if (!organizationId) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (!userOrg) {
      return { success: false, error: 'No organization found', contents: [] }
    }
    organizationId = userOrg.organizationId
  }

  const contents = await prisma.content.findMany({
    where: {
      organizationId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      createdBy: { select: { name: true, email: true } },
    },
  })

  return { success: true, contents }
}

export async function getContentAction({ contentId }: { contentId: string }) {
  const session = await auth()
  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', content: null }
  }

  // If no tenant ID in header, get user's first organization
  if (!organizationId) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (!userOrg) {
      return { success: false, error: 'No organization found', content: null }
    }
    organizationId = userOrg.organizationId
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId, organizationId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
      createdBy: { select: { name: true, email: true } },
    },
  })

  if (!content) {
    return { success: false, error: 'Content not found', content: null }
  }

  return { success: true, content }
}
