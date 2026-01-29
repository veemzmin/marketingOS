import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { logoutAction } from "@/app/actions/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      {/* User info bar */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Logged in as:</span>
              <span className="font-medium text-gray-900">{session.user?.email}</span>
              {session.user?.name && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-900">{session.user.name}</span>
                </>
              )}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
