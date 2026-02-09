"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/content/list", label: "Content" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/audit", label: "Audit" },
  { href: "/settings/security", label: "Security" },
]

interface TopNavClientProps {
  user?: { name: string | null; email: string | null } | null
  organization?: { name: string; slug: string } | null
}

export function TopNavClient({ user, organization }: TopNavClientProps) {
  const pathname = usePathname()

  if (pathname.startsWith("/auth")) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-gray-900">
            Marketing OS
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-gray-600 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {organization && (
            <div className="hidden rounded-md bg-gray-100 px-2 py-1 text-gray-700 md:block">
              {organization.name}
            </div>
          )}
          {user ? (
            <div className="hidden text-gray-700 md:block">
              {user.name || user.email}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-gray-900">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-gray-100 px-4 py-2 md:hidden">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border border-gray-200 px-2 py-1 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
