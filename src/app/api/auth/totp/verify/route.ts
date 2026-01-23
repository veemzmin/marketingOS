import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import speakeasy from "speakeasy"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get TOTP code from request body
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "TOTP code is required" },
        { status: 400 }
      )
    }

    // Find temporary setup record
    const totpSetup = await prisma.totpSetup.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: { gte: new Date() }, // Not expired
      },
      orderBy: { createdAt: "desc" }, // Get most recent
    })

    if (!totpSetup) {
      return NextResponse.json(
        { error: "No active TOTP setup found. Please restart the setup process." },
        { status: 404 }
      )
    }

    // Verify TOTP code with 2-window tolerance (±60 seconds for clock skew)
    const verified = speakeasy.totp.verify({
      secret: totpSetup.secret,
      encoding: "base32",
      token: code,
      window: 2, // ±60 seconds tolerance
    })

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid TOTP code. Please try again." },
        { status: 400 }
      )
    }

    // Enable 2FA and save secret to user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpEnabled: true,
        totpSecret: totpSetup.secret,
      },
    })

    // Delete the temporary setup record
    await prisma.totpSetup.delete({
      where: { id: totpSetup.id },
    })

    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully",
    })
  } catch (error) {
    console.error("TOTP verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify TOTP code" },
      { status: 500 }
    )
  }
}
