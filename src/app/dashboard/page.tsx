import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Quick actions grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/content/create"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Content</h2>
              <p className="text-sm text-gray-500">Generate new marketing content</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/content/list"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3 group-hover:bg-green-200 transition-colors">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">View Content</h2>
              <p className="text-sm text-gray-500">Browse and manage your content</p>
            </div>
          </div>
        </Link>

        <Link
          href="/governance/test"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Governance Test</h2>
              <p className="text-sm text-gray-500">Test content validation rules</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-orange-100 p-3 group-hover:bg-orange-200 transition-colors">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
              <p className="text-sm text-gray-500">User administration and invites</p>
            </div>
          </div>
        </Link>

        <Link
          href="/audit"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-100 p-3 group-hover:bg-yellow-200 transition-colors">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
              <p className="text-sm text-gray-500">View system activity history</p>
            </div>
          </div>
        </Link>

        <Link
          href="/settings/security"
          className="group rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gray-100 p-3 group-hover:bg-gray-200 transition-colors">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Security and preferences</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Status card */}
      <div className="mt-8 rounded-lg bg-blue-50 p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900">System Status</h3>
        <p className="mt-2 text-blue-800">
          All systems operational. Governance engine is active and monitoring content generation.
        </p>
      </div>
    </div>
  )
}
