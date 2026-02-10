"use client"

import { useState } from "react"
import { changeUserRoleAction } from "@/app/actions/admin"
import { Role } from "@prisma/client"

interface RoleChangeDropdownProps {
  userId: string
  currentRole: Role
}

const ROLE_OPTIONS = [
  { value: Role.ADMIN, label: "Admin", color: "text-purple-700" },
  { value: Role.REVIEWER, label: "Reviewer", color: "text-blue-700" },
  { value: Role.CREATOR, label: "Creator", color: "text-green-700" },
  { value: Role.VIEWER, label: "Viewer", color: "text-gray-700" },
]

export function RoleChangeDropdown({
  userId,
  currentRole,
}: RoleChangeDropdownProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === role) return

    setLoading(true)
    setError(null)

    try {
      const result = await changeUserRoleAction(userId, newRole)

      if (result.error) {
        setError(result.error)
        return
      }

      setRole(newRole)
    } catch {
      setError("Failed to change role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        disabled={loading}
        className="text-sm font-medium rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 cursor-pointer"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}
    </div>
  )
}
