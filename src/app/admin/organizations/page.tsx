import { requireAdmin } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"

export default async function AdminOrganizationsPage() {
  // Require admin permission
  await requireAdmin()

  // Get tenant context
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return <div>No organization context</div>
  }

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          userOrganizations: true,
          auditLogs: true,
        },
      },
    },
  })

  if (!organization) {
    return <div>Organization not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Details</h1>
        <p className="text-gray-600">
          View and manage your organization settings
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization Name</dt>
              <dd className="mt-1 text-lg text-gray-900">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization Slug</dt>
              <dd className="mt-1 text-lg text-gray-900 font-mono">{organization.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {new Date(organization.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{organization.id}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-purple-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-purple-600">Total Members</dt>
              <dd className="mt-2 text-3xl font-bold text-purple-900">
                {organization._count.userOrganizations}
              </dd>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-blue-600">Audit Log Entries</dt>
              <dd className="mt-2 text-3xl font-bold text-blue-900">
                {organization._count.auditLogs}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
