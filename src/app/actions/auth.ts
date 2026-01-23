"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/db/client"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { redirect } from "next/navigation"

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
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: null, // Will be set in email verification flow
    },
  })

  return { success: true, message: "Account created. Check your email to verify." }
}

export async function logoutAction() {
  await signOut({ redirect: true, redirectTo: "/" })
}
