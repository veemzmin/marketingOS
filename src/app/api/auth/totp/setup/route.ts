import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import speakeasy from "speakeasy"
import qrcode from "qrcode"
import { logger } from "@/lib/logger"

export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpEnabled: true },
    })

    if (user?.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled for this account" },
        { status: 400 }
      )
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Marketing OS (${session.user.email})`,
      issuer: "Marketing OS",
    })

    if (!secret.base32) {
      return NextResponse.json(
        { error: "Failed to generate TOTP secret" },
        { status: 500 }
      )
    }

    // Generate QR code data URL
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || "")

    // Delete any existing setup attempts for this user
    await prisma.totpSetup.deleteMany({
      where: { userId: session.user.id },
    })

    // Store temporary setup record (10 minute expiry)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    await prisma.totpSetup.create({
      data: {
        userId: session.user.id,
        secret: secret.base32,
        expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
    })
  } catch (error) {
    logger.error("TOTP setup error:", error)
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    )
  }
}
