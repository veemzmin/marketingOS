import { prisma } from '@/lib/db/client'

export async function getLatestVersion(contentId: string) {
  return prisma.contentVersion.findFirst({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  })
}

export async function shouldCreateVersion(contentId: string, newBody: string): Promise<boolean> {
  const latestVersion = await getLatestVersion(contentId)
  if (!latestVersion) return true

  // Only create version if content actually changed
  return latestVersion.body !== newBody
}
