import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js Middleware
 *
 * Runs on every request matching the config.matcher below.
 *
 * NOTE: Temporarily simplified for Phase 2 governance testing.
 * Full multi-tenant middleware will be re-enabled after Phase 2.
 */
export async function middleware(_request: NextRequest) {
  // Temporarily disabled - will re-enable after Phase 2 testing
  // Multi-tenant context extraction requires Prisma which doesn't work in Edge runtime
  return NextResponse.next()
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
     * - /governance/* (governance test pages - temporarily excluded)
     * - /api/governance/* (governance API - temporarily excluded)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|verify-email|unauthorized|governance|api/governance).*)",
  ],
}
