import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"
import { TopNavClient } from "./TopNavClient"

export async function TopNav() {
  const session = await auth()
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  const [user, organization] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true },
        })
      : Promise.resolve(null),
    tenantId
      ? prisma.organization.findUnique({
          where: { id: tenantId },
          select: { name: true, slug: true },
        })
      : Promise.resolve(null),
  ])

  return <TopNavClient user={user} organization={organization} />
}
