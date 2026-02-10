/* eslint-disable no-console */
require("dotenv").config()
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { PrismaClient } = require("../generated/prisma/client")

const prisma = new PrismaClient()

async function main() {
  const email = "admin@example.com"
  const password = "password123"
  const organizationSlug = "default-organization"
  const organizationName = "Default Organization"

  const existingUser = await prisma.user.findUnique({ where: { email } })

  let user = existingUser
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12)
    user = await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash,
        emailVerified: new Date(),
      },
    })
    console.log(`Created user ${email}`)
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
    console.log(`Verified user ${email}`)
  } else {
    console.log(`User ${email} already exists`)
  }

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
  })

  let organization = existingOrg
  if (!organization) {
    const orgId = `org_${crypto.randomUUID().replace(/-/g, "")}`
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      orgId
    )

    organization = await prisma.organization.create({
      data: {
        id: orgId,
        slug: organizationSlug,
        name: organizationName,
      },
    })
    console.log(`Created organization ${organizationName}`)
  } else {
    console.log(`Organization ${organizationSlug} already exists`)
  }

  await prisma.$executeRawUnsafe(
    "SELECT set_config('app.current_tenant_id', $1, false)",
    organization.id
  )

  const existingMembership = await prisma.userOrganization.findFirst({
    where: {
      userId: user.id,
      organizationId: organization.id,
    },
  })

  if (!existingMembership) {
    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "ADMIN",
      },
    })
    console.log("Added user to organization as ADMIN")
  } else {
    console.log("User already in organization")
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
