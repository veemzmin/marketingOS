"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmailAction, resendVerificationAction } from "@/app/actions/auth"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  )
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle")
  const [resendMessage, setResendMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    // Verify the token
    verifyEmailAction(token).then((result) => {
      if (result.error) {
        setStatus("error")
        setMessage(result.error)
        if (result.error.includes("expired")) {
          // Token expired, show resend option
          setEmail("")
        }
      } else if (result.success) {
        setStatus("success")
        setEmail(result.email || "")
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login?verified=true")
        }, 3000)
      }
    })
  }, [token, router])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendStatus("sending")
    setResendMessage("")

    const result = await resendVerificationAction(resendEmail)

    if (result.error) {
      setResendStatus("error")
      setResendMessage(result.error)
    } else if (result.success) {
      setResendStatus("sent")
      setResendMessage(result.message || "Verification email sent!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "verifying" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-4">
              Your email address has been successfully verified.
            </p>
            {email && (
              <p className="text-sm text-gray-500 mb-4">
                Verified: <strong>{email}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-red-600 mb-6">{message}</p>

            {message.includes("expired") && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Request a New Verification Link
                </h2>
                <form onSubmit={handleResend} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="your@email.com"
                    />
                  </div>

                  {resendMessage && (
                    <div
                      className={`p-3 rounded-md text-sm ${
                        resendStatus === "error"
                          ? "bg-red-50 text-red-800"
                          : "bg-green-50 text-green-800"
                      }`}
                    >
                      {resendMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resendStatus === "sending"}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus === "sending"
                      ? "Sending..."
                      : "Resend Verification Email"}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6">
              <a
                href="/auth/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Back to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
