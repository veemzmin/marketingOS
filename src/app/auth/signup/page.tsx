"use client"

import { signupAction } from "@/app/actions/auth"
import { useFormState } from "react-dom"
import { useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
    >
      {pending ? "Creating account..." : "Create Account"}
    </button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Create Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign up for Marketing OS
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {state.message}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Min 12 chars, uppercase, lowercase, number, special"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 12 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
