import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { extractTenantContext } from "@/lib/middleware/tenant-context"

/**
 * Next.js Middleware
 *
 * Runs on every request matching the config.matcher below.
 * Extracts tenant context and injects headers for downstream use.
 *
 * Headers injected:
 * - x-tenant-id: Organization ID for RLS context
 * - x-user-id: Authenticated user ID
 * - x-user-email: Authenticated user email
 */
export async function middleware(request: NextRequest) {
  // Get authenticated session
  const session = await auth()

  // Unauthenticated users - let them through to auth pages
  if (!session?.user?.id) {
    return NextResponse.next()
  }

  // Extract tenant context from subdomain or path
  const tenantContext = await extractTenantContext(request, session.user.id)

  // No valid tenant context - redirect to unauthorized
  if (!tenantContext) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // Clone the request headers and inject tenant context
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenantContext.tenantId)
  requestHeaders.set("x-user-id", session.user.id)
  requestHeaders.set("x-user-email", session.user.email || "")

  // Return response with injected headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

/**
 * Middleware matcher configuration
 *
 * Runs middleware on:
 * - All routes except static files, images, and auth pages
 *
 * Excludes:
 * - _next/static (Next.js static assets)
 * - _next/image (Next.js image optimization)
 * - favicon.ico
 * - /auth/* (authentication pages)
 * - /api/auth/* (authentication API routes)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - /auth/* (authentication pages)
     * - /api/auth/* (authentication API)
     * - /verify-email (email verification page)
     * - /unauthorized (access denied page)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|verify-email|unauthorized).*)",
  ],
}
