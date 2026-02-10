import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Next.js Middleware
 *
 * Runs on every request matching the config.matcher below.
 *
 * NOTE: Tenant context is resolved via an internal API to avoid Prisma in Edge runtime.
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.id) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const host = request.headers.get("host") || ""
  const hostParts = host.split(".")
  const hasSubdomain = hostParts.length >= 3 && hostParts[0] !== "www"
  const subdomainSlug = hasSubdomain ? hostParts[0] : null
  const orgPathMatch = pathname.match(/^\/org\/([^\/]+)/)
  const pathSlug = orgPathMatch ? orgPathMatch[1] : null
  const requestedSlug = subdomainSlug || pathSlug

  const tenantIdCookie = request.cookies.get("tenant-id")?.value
  const tenantSlugCookie = request.cookies.get("tenant-slug")?.value

  const shouldResolve =
    !tenantIdCookie ||
    (requestedSlug && requestedSlug !== tenantSlugCookie)

  let tenantId = tenantIdCookie
  let tenantSlug = tenantSlugCookie || requestedSlug || null

  if (shouldResolve) {
    const resolveUrl = new URL("/api/tenant/resolve", request.url)
    if (requestedSlug) {
      resolveUrl.searchParams.set("slug", requestedSlug)
    }

    const resolveResponse = await fetch(resolveUrl, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    })

    let resolved: { tenantId: string; organizationSlug: string } | null = null

    if (resolveResponse.ok) {
      resolved = (await resolveResponse.json()) as {
        tenantId: string
        organizationSlug: string
      }
    } else if (requestedSlug || tenantSlugCookie) {
      const fallbackUrl = new URL("/api/tenant/resolve", request.url)
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      })

      if (fallbackResponse.ok) {
        resolved = (await fallbackResponse.json()) as {
          tenantId: string
          organizationSlug: string
        }
      }
    }

    if (!resolved && token?.id && process.env.INTERNAL_RESOLVE_SECRET) {
      const internalUrl = new URL("/api/tenant/resolve", request.url)
      internalUrl.searchParams.set("userId", String(token.id))
      const internalResponse = await fetch(internalUrl, {
        headers: {
          "x-internal-resolve": process.env.INTERNAL_RESOLVE_SECRET,
        },
        cache: "no-store",
      })

      if (internalResponse.ok) {
        resolved = (await internalResponse.json()) as {
          tenantId: string
          organizationSlug: string
        }
      }
    }

    if (!resolved) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized tenant" },
          { status: resolveResponse.status }
        )
      }

      const redirectResponse = NextResponse.redirect(
        new URL("/unauthorized", request.url)
      )
      redirectResponse.cookies.delete("tenant-id")
      redirectResponse.cookies.delete("tenant-slug")
      return redirectResponse
    }

    tenantId = resolved.tenantId
    tenantSlug = resolved.organizationSlug
  }

  if (!tenantId) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenantId)
  requestHeaders.set("x-user-id", String(token.id))
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.cookies.set("tenant-id", tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
  if (tenantSlug) {
    response.cookies.set("tenant-slug", tenantSlug, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  }

  return response
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
     * - /api/tenant/resolve (tenant resolver API)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|api/tenant/resolve|verify-email|unauthorized).*)",
  ],
}
