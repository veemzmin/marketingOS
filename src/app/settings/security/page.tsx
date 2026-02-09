"use client"

import { useState } from "react"
import Image from "next/image"

export default function SecuritySettingsPage() {
  const [setupState, setSetupState] = useState<"idle" | "loading" | "qr" | "verifying" | "success">("idle")
  const [qrCode, setQrCode] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [error, setError] = useState<string>("")

  async function handleStartSetup() {
    setSetupState("loading")
    setError("")

    try {
      const response = await fetch("/api/auth/totp/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to setup 2FA")
        setSetupState("idle")
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setSetupState("qr")
    } catch {
      setError("Network error. Please try again.")
      setSetupState("idle")
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setSetupState("verifying")
    setError("")

    try {
      const response = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Verification failed")
        setSetupState("qr")
        return
      }

      setSetupState("success")
    } catch {
      setError("Network error. Please try again.")
      setSetupState("qr")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account security and two-factor authentication</p>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication (2FA)</h2>
            <p className="mt-2 text-gray-600">
              Add an extra layer of security to your account by requiring a code from your authenticator app
              when signing in.
            </p>

            {setupState === "idle" && (
              <div className="mt-6">
                <button
                  onClick={handleStartSetup}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {setupState === "loading" && (
              <div className="mt-6">
                <p className="text-gray-600">Setting up 2FA...</p>
              </div>
            )}

            {(setupState === "qr" || setupState === "verifying") && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Step 1: Scan QR Code</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Use Google Authenticator, Authy, 1Password, or any TOTP authenticator app to scan this QR code:
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Image
                      src={qrCode}
                      alt="TOTP QR Code"
                      width={256}
                      height={256}
                      className="border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Step 2: Manual Entry (Optional)</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    If you can&apos;t scan the QR code, enter this secret manually:
                  </p>
                  <div className="mt-2 rounded-md bg-gray-100 p-3">
                    <code className="text-sm font-mono text-gray-900">{secret}</code>
                  </div>
                </div>

                <form onSubmit={handleVerify}>
                  <h3 className="text-lg font-medium text-gray-900">Step 3: Verify Code</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app to confirm setup:
                  </p>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={setupState === "verifying" || verificationCode.length !== 6}
                      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {setupState === "verifying" ? "Verifying..." : "Verify and Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSetupState("idle")
                        setError("")
                        setVerificationCode("")
                      }}
                      className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {setupState === "success" && (
              <div className="mt-6">
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">
                    2FA has been successfully enabled for your account! You&apos;ll now need to enter a code from your
                    authenticator app when signing in.
                  </p>
                </div>
              </div>
            )}

            {error && setupState === "idle" && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
