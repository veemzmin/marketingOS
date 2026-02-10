import { requireAdmin } from "@/lib/auth/permissions"
import { prisma, basePrisma } from "@/lib/db/client"
import { headers } from "next/headers"
import { auth } from "@/auth"
import Link from "next/link"
import { RoleChangeDropdown } from "./role-change-dropdown"
import { AppShell } from "@/components/layout/AppShell"
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
  setUserActiveAction,
  removeUserFromOrganizationAction,
} from "@/app/actions/admin"
import { Role } from "@prisma/client"

export default async function AdminUsersPage() {
  // Require admin permission
  await requireAdmin()

  // Get tenant context
  const headersList = await headers()
  let tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    const session = await auth()
    if (session?.user?.id) {
      const fallbackMembership = await basePrisma.userOrganization.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { organizationId: true },
      })
      tenantId = fallbackMembership?.organizationId || null
    }
  }

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
          isActive: true,
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/users/invite"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Invite User
          </Link>
        </div>
        <details className="w-full max-w-xl rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            Create User
          </summary>
          <form action={createUserAction} className="mt-3 grid gap-3 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Name</span>
                <input
                  name="name"
                  type="text"
                  className="rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Full name"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-md border border-gray-300 px-3 py-2"
                  placeholder="user@company.com"
                />
              </label>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Temp Password</span>
                <input
                  name="password"
                  type="text"
                  required
                  className="rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Set a temporary password"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-gray-600">Role</span>
                <select
                  name="role"
                  defaultValue={Role.VIEWER}
                  className="rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.REVIEWER}>Reviewer</option>
                  <option value={Role.CREATOR}>Creator</option>
                  <option value={Role.VIEWER}>Viewer</option>
                </select>
              </label>
            </div>
            <button className="w-fit rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Create User
            </button>
          </form>
        </details>
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.user.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600">Manage</summary>
                    <div className="mt-2 space-y-3">
                      <form action={updateUserAction} className="grid gap-2">
                        <input type="hidden" name="userId" value={member.user.id} />
                        <label className="grid gap-1">
                          <span className="text-xs text-gray-600">Name</span>
                          <input
                            name="name"
                            defaultValue={member.user.name || ""}
                            className="rounded-md border border-gray-300 px-2 py-1"
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-gray-600">Email</span>
                          <input
                            name="email"
                            type="email"
                            defaultValue={member.user.email}
                            className="rounded-md border border-gray-300 px-2 py-1"
                          />
                        </label>
                        <button className="w-fit rounded-md bg-gray-900 px-3 py-1 text-xs text-white">
                          Update Profile
                        </button>
                      </form>

                      <form action={resetPasswordAction} className="grid gap-2">
                        <input type="hidden" name="userId" value={member.user.id} />
                        <label className="grid gap-1">
                          <span className="text-xs text-gray-600">New Password</span>
                          <input
                            name="password"
                            type="text"
                            className="rounded-md border border-gray-300 px-2 py-1"
                            placeholder="Set new password"
                          />
                        </label>
                        <button className="w-fit rounded-md bg-blue-600 px-3 py-1 text-xs text-white">
                          Reset Password
                        </button>
                      </form>

                      <form action={setUserActiveAction}>
                        <input type="hidden" name="userId" value={member.user.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={member.user.isActive ? "false" : "true"}
                        />
                        <button className="w-fit rounded-md bg-yellow-500 px-3 py-1 text-xs text-white">
                          {member.user.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>

                      <form action={removeUserFromOrganizationAction}>
                        <input type="hidden" name="userId" value={member.user.id} />
                        <button className="w-fit rounded-md bg-red-600 px-3 py-1 text-xs text-white">
                          Remove From Org
                        </button>
                      </form>
                    </div>
                  </details>
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
