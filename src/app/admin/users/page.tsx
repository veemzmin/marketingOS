import { requireAdmin } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"
import Link from "next/link"
import { RoleChangeDropdown } from "./role-change-dropdown"
import { AppShell } from "@/components/layout/AppShell"

export default async function AdminUsersPage() {
  // Require admin permission
  await requireAdmin()

  // Get tenant context
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return <div>No organization context</div>
  }

  // Get all organization members
  const members = await prisma.userOrganization.findMany({
    where: {
      organizationId: tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          totpEnabled: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })

  return (
    <AppShell>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage users and permissions for {organization?.name}
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/users/invite"
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Invite User
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2FA Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.user.name || "No name set"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.user.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.user.totpEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RoleChangeDropdown
                    userId={member.user.id}
                    currentRole={member.role}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No members found. Invite your first user to get started.
          </div>
        )}
      </div>
    </div>
    </AppShell>
  )
}
