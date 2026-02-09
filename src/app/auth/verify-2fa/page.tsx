"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verify2FAAction } from "@/app/actions/auth"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <Verify2FAContent />
    </Suspense>
  )
}

function Verify2FAContent() {
  const [code, setCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email) {
      setError("Invalid session. Please try logging in again.")
      setLoading(false)
      return
    }

    try {
      const result = await verify2FAAction(email, code)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push("/dashboard")
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Invalid Session</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please <a href="/auth/login" className="text-blue-600 hover:text-blue-500">log in</a> again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Two-Factor Authentication</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Authentication Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </a>
        </p>
      </div>
    </div>
  )
}
