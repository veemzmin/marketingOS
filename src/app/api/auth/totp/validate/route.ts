import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import speakeasy from "speakeasy"

export async function POST(request: NextRequest) {
  try {
    // Get email and TOTP code from request body
    const body = await request.json()
    const { email, code } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "TOTP code is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        totpEnabled: true,
        totpSecret: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.totpEnabled || !user.totpSecret) {
      return NextResponse.json(
        { error: "2FA is not enabled for this account" },
        { status: 400 }
      )
    }

    // Verify TOTP code with 2-window tolerance (±60 seconds for clock skew)
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
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

    return NextResponse.json({
      success: true,
      message: "TOTP code verified successfully",
    })
  } catch (error) {
    console.error("TOTP validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate TOTP code" },
      { status: 500 }
    )
  }
}
