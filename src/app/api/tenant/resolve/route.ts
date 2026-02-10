import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { basePrisma } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get("slug")

  if (slug) {
    const organization = await basePrisma.organization.findUnique({
      where: { slug },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const membership = await basePrisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      tenantId: organization.id,
      organizationSlug: organization.slug,
    })
  }

  const membership = await basePrisma.userOrganization.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  })

  if (!membership?.organization) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  return NextResponse.json({
    tenantId: membership.organization.id,
    organizationSlug: membership.organization.slug,
  })
}
