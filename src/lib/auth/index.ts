import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"

/**
 * Get the current authenticated user with organization memberships.
 */
export async function getCurrentUser() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userOrganizations: true },
  })
}
