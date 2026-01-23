"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/db/client"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { sendVerificationEmail } from "@/lib/email/client"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message || "Invalid credentials" }
    }
    throw error
  }

  redirect("/dashboard")
}

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  // Validate password strength
  const validation = validatePasswordStrength(password)
  if (!validation.valid) {
    return { error: validation.errors.join(", ") }
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Email already registered" }
  }

  // Create user (emailVerified will be null until verified)
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: null, // Will be set in email verification flow
    },
  })

  // Generate verification token (24-hour expiry per healthcare standard)
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // Send verification email
  await sendVerificationEmail(email, token)

  return { success: true, message: "Account created. Check your email to verify." }
}

export async function logoutAction() {
  await signOut({ redirect: true, redirectTo: "/" })
}

export async function verifyEmailAction(token: string) {
  // Find the verification token
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    return { error: "Invalid verification token" }
  }

  // Check if token has expired
  if (verificationToken.expiresAt < new Date()) {
    return { error: "Verification token has expired. Please request a new one." }
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() },
  })

  // Delete the used token
  await prisma.emailVerificationToken.delete({
    where: { id: verificationToken.id },
  })

  return { success: true, email: verificationToken.user.email }
}

export async function resendVerificationAction(email: string) {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: "User not found" }
  }

  // Check if already verified
  if (user.emailVerified) {
    return { error: "Email already verified" }
  }

  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  })

  // Generate new token
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // Send verification email
  await sendVerificationEmail(email, token)

  return { success: true, message: "Verification email sent. Check your inbox." }
}
