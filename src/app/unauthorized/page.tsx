import Link from "next/link"
import { auth } from "@/auth"

/**
 * Unauthorized Access Page
 *
 * Shown when:
 * - User tries to access a tenant they don't belong to
 * - No valid tenant context can be extracted from subdomain/path
 * - User is not a member of the organization
 */
export default async function UnauthorizedPage() {
  const session = await auth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              className="h-full w-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have access to this organization
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-gray-900">
              Why am I seeing this?
            </h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>You are not a member of the requested organization</li>
              <li>The organization subdomain or path is invalid</li>
              <li>Your membership was revoked</li>
            </ul>
          </div>

          {session?.user ? (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Signed in as: <strong>{session.user.email}</strong>
              </p>
              <p className="text-sm text-gray-600">
                If you believe this is an error, contact your organization
                administrator.
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                You may need to sign in to access this organization.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
          {session?.user ? (
            <Link
              href="/auth/logout"
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
