import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-b from-white to-gray-50">
      <div className="z-10 max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Marketing OS
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-6">
            AI-powered content generation with governance at generation time
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Built for healthcare and mental health campaigns, ensuring compliance and safety
            before content is ever created.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link
            href="/auth/login"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Create Account
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Governance First</h3>
            <p className="text-gray-600">
              Compliance built into generation, not bolted on afterwards
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Multi-Tenant</h3>
            <p className="text-gray-600">Secure, isolated environments for every organization</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Workflow Ready</h3>
            <p className="text-gray-600">
              Integrates with n8n for sophisticated campaign automation
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">Phase 1: Foundation & Authentication</p>
        </div>
      </div>
    </main>
  )
}
