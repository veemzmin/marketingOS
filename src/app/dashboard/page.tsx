import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { logoutAction } from "@/app/actions/auth"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Welcome back!</h2>
              <p className="mt-1 text-gray-600">
                You are logged in as: <span className="font-medium text-gray-900">{session.user?.email}</span>
              </p>
              {session.user?.name && (
                <p className="text-gray-600">
                  Name: <span className="font-medium text-gray-900">{session.user.name}</span>
                </p>
              )}
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">Core authentication is now active</p>
              <p className="mt-1">Next steps: Email verification and 2FA will be implemented in the next phase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
