"use client"

import { useState } from "react"
import { inviteUserAction } from "@/app/actions/admin"
import { Role } from "../../../../../generated/prisma/client"
import { useRouter } from "next/navigation"

export function InviteForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>(Role.VIEWER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await inviteUserAction(email, role)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(result.message || "Invitation sent successfully")
      setEmail("")
      
      setTimeout(() => {
        router.push("/admin/users")
      }, 2000)
    } catch (err) {
      setError("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="user@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={loading}
        >
          <option value={Role.VIEWER}>Viewer - Read-only access</option>
          <option value={Role.CREATOR}>Creator - Can create content</option>
          <option value={Role.REVIEWER}>Reviewer - Can review and approve</option>
          <option value={Role.ADMIN}>Admin - Full access</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Sending Invitation..." : "Send Invitation"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
