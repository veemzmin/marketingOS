import { requireAdmin } from "@/lib/auth/permissions"
import { InviteForm } from "./invite-form"
import Link from "next/link"

export default async function InviteUserPage() {
  // Require admin permission
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-purple-600 hover:text-purple-800 text-sm"
        >
          ← Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Invite User</h1>
        <p className="text-gray-600 mb-8">
          Invite a new user or add an existing user to your organization
        </p>

        <InviteForm />
      </div>
    </div>
  )
}
