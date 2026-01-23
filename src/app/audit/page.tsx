import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"

/**
 * Audit Log Viewer
 *
 * Displays recent audit events for the current organization.
 * Admin-only access. Provides CSV export functionality.
 */
export default async function AuditPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  // Get tenant context from headers
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return <div>No tenant context</div>
  }

  // Check if user is ADMIN
  const userOrg = await prisma.userOrganization.findFirst({
    where: {
      userId: session.user.id,
      organizationId: tenantId,
      role: "ADMIN",
    },
  })

  if (!userOrg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">Admin access required to view audit logs.</p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch recent audit logs (last 100)
  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: tenantId,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <a
              href="/api/audit/export"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Export CSV
            </a>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Showing most recent {logs.length} events
          </div>

          {logs.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-8 text-center text-gray-500">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Resource ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{log.user?.email || "system"}</div>
                        {log.user?.name && (
                          <div className="text-xs text-gray-500">{log.user.name}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={log.resourceId || ""}>
                          {log.resourceId || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            View
                          </summary>
                          <div className="mt-2 max-w-md rounded-md bg-gray-50 p-3 text-xs">
                            {log.changes && (
                              <div className="mb-2">
                                <div className="font-semibold text-gray-700">Changes:</div>
                                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-gray-600">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.metadata && (
                              <div>
                                <div className="font-semibold text-gray-700">Metadata:</div>
                                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-gray-600">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
