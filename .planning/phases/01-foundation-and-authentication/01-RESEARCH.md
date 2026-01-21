# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-01-21
**Domain:** Authentication, multi-tenancy, audit logging for healthcare compliance
**Confidence:** HIGH

## Summary

Phase 1 requires building a secure multi-tenant authentication layer with complete data isolation, role-based access control, and comprehensive audit logging. The research identifies proven patterns for Next.js 14 + Prisma + PostgreSQL stack to meet healthcare compliance requirements.

**Key findings:**
- **Auth.js (NextAuth) v5** is the standard choice for Next.js 14 App Router with proper server-side session handling
- **PostgreSQL Row Level Security (RLS)** with runtime context variables (`set_config`) provides defense-in-depth tenant isolation
- **Middleware-based audit logging** via Prisma middleware captures all mutations with application context
- **TOTP (Time-based One-Time Password)** is the established 2FA pattern with libraries like `speakeasy`
- **Subdomain routing** via Next.js middleware enables clean multi-tenant UX (tenant.example.com)

**Primary recommendation:** Use Auth.js v5 for authentication, implement tenant context at middleware + database levels (defense-in-depth), store immutable audit logs in PostgreSQL with append-only schema, and enforce RLS policies as database-level safety net.

## Standard Stack

### Core Authentication
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Auth.js (next-auth) | v5 (beta/RC) | Session management, credential handling, OAuth integration | Official Next.js recommendation for App Router, battle-tested, modern TypeScript support |
| bcryptjs | 2.4.3+ | Password hashing before storage | Industry standard for password hashing, slows brute-force attacks |
| speakeasy | 2.0.0+ | TOTP secret generation and verification | Well-maintained, widely used for Google Authenticator/Authy integration |
| qrcode | 1.5.0+ | QR code generation for 2FA setup | Works with speakeasy, user-friendly TOTP enrollment |

### Multi-Tenancy & Authorization
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prisma | 5.7+* | Database ORM with TypeScript support | Already committed in tech stack; handles multi-tenant queries efficiently |
| PostgreSQL | 14+ | Primary database with RLS extension | RLS provides database-level enforcement of tenant isolation |
| next/headers (cookies) | built-in | Server-side session storage via HttpOnly cookies | Native to Next.js 14, secure for server components |

*Verify current version in package.json; must be 5.7+ for Client Extensions used in audit middleware

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth.js v5 | Clerk | Clerk handles more (user management, orgs) but is vendor lock-in, costs scale with users. Auth.js gives full control, lower cost |
| Auth.js v5 | Supabase Auth | Supabase is hosted, simpler ops, but less customization for healthcare-specific requirements |
| bcryptjs | argon2id | argon2id is more modern/secure but bcryptjs is simpler, sufficient for passwords (not sensitive data itself) |
| PostgreSQL RLS | Application-layer filtering | RLS is defense-in-depth; app-layer filtering alone leaves room for bugs causing data leaks |
| Speakeasy | otplib | otplib is lighter, speakeasy has more features and better docs |

**Installation:**
```bash
npm install next-auth@beta bcryptjs speakeasy qrcode
npm install -D @types/speakeasy @types/bcryptjs

# Prisma already installed; verify version
npm list prisma
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts           # Auth.js route handler
│   │   ├── organizations/          # Org-scoped endpoints
│   │   └── audit/                  # Audit log queries (read-only)
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/           # Email verification flow
│   │   └── setup-2fa/              # 2FA enrollment
│   ├── dashboard/
│   │   └── [organizationId]/       # Org context from subdomain or route param
│   └── middleware.ts               # Tenant context extraction
├── lib/
│   ├── auth/
│   │   ├── config.ts               # Auth.js configuration
│   │   ├── actions.ts              # Server actions (sign in/up/out)
│   │   └── validators.ts           # Input validation
│   ├── db/
│   │   ├── client.ts               # Prisma Client instance (singleton)
│   │   └── audit.ts                # Audit middleware & helpers
│   ├── middleware/
│   │   ├── tenant-context.ts       # Extract & set org from subdomain/path
│   │   └── auth-guard.ts           # Check role-based permissions
│   └── types/
│       ├── auth.ts                 # User, Session, token types
│       └── tenant.ts               # Organization, role types
├── db/
│   └── schema.prisma               # Prisma schema (multi-tenant + audit)
└── middleware.ts                   # Next.js request middleware
```

### Pattern 1: Auth.js with Credentials Provider + Custom Email Verification

**What:** Email/password authentication with custom email verification flow (not passwordless magic links, since healthcare requires password control)

**When to use:** Primary auth method for all users; passwords enable password strength requirements for compliance

**Setup (auth.ts):**
```typescript
// Source: https://authjs.dev/getting-started/installation
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { comparePasswords } from "@/lib/auth/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Find user by email (with organization context)
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { organizations: { include: { roles: true } } },
        })

        if (!user || !user.emailVerified) {
          throw new Error("Email not verified or user not found")
        }

        // 2. Verify password
        const isValid = await comparePasswords(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) throw new Error("Invalid credentials")

        // 3. Check if 2FA is required (return user + mfa flag for verification step)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          requiresMfa: user.totpEnabled, // Signal client to show 2FA prompt
        }
      },
    }),
  ],
  callbacks: {
    // Include org context in JWT for use in middleware + API routes
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      // On update (e.g., after 2FA verification), merge session data
      if (trigger === "update" && session?.organizationId) {
        token.organizationId = session.organizationId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.organizationId = token.organizationId as string
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // Stateless; token verified on each request
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true, // Required for production
})
```

**Login flow (server action):**
```typescript
// Source: https://nextjs.org/docs/14/app/building-your-application/authentication
'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function login(formData: FormData) {
  try {
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })

    if (!result?.ok) {
      return { error: "Invalid credentials" }
    }

    // If user requires MFA, redirect to verification page
    if (result.user?.requiresMfa) {
      return { requiresMfa: true, userId: result.user.id }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message || "Authentication failed" }
    }
    throw error
  }
}
```

### Pattern 2: Tenant Context via Next.js Middleware + PostgreSQL RLS

**What:** Extract tenant context from subdomain/path in middleware, set as PostgreSQL session variable for RLS enforcement

**When to use:** Every request must establish which organization the user belongs to before database queries; RLS prevents accidental cross-tenant leaks

**Example subdomain setup (middleware.ts):**
```typescript
// Source: https://medium.com/@sheharyarishfaq/subdomain-based-routing-in-nextjs-a-complete-multitenant-application-1576244e799a
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

export async function middleware(request: NextRequest) {
  const session = await auth()

  // Extract tenant from subdomain (acme.example.com -> acme)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  const subdomain = host.split(".")[0]

  // Verify user belongs to this organization
  if (session?.user?.id) {
    const org = await db.organization.findFirst({
      where: {
        slug: subdomain,
        members: { some: { userId: session.user.id } },
      },
    })

    if (!org) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    // Set tenant context for database queries
    // Store as header to be read by database middleware
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-id", org.id)
    requestHeaders.set("x-user-id", session.user.id)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Exclude auth routes and public assets
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

**PostgreSQL RLS setup (schema.prisma):**
```prisma
// Enable RLS on critical tables
model Organization {
  id            String @id @default(cuid())
  slug          String @unique
  name          String
  users         UserOrganization[]
  content        Content[]
  auditLogs     AuditLog[]

  @@map("organizations")
}

model Content {
  id              String @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  title           String
  // ... other fields

  @@unique([organizationId, id])  // Composite key for RLS efficiency
  @@map("content")
}

model AuditLog {
  id              String @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId          String
  action          String
  resource        String
  timestamp       DateTime @default(now())
  metadata        Json?

  // Immutable: no update/delete allowed
  @@unique([organizationId, id])
  @@map("audit_logs")
}
```

**PostgreSQL RLS policy (raw SQL in migration):**
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their organization's data
CREATE POLICY tenant_isolation ON content
  USING (
    organization_id = (current_setting('app.current_tenant_id')::uuid)
  );

-- Apply same policy to audit logs
CREATE POLICY tenant_isolation ON audit_logs
  USING (
    organization_id = (current_setting('app.current_tenant_id')::uuid)
  );

-- Audit logs: append-only (no update/delete)
CREATE POLICY audit_immutable ON audit_logs
  AS (USING (true), WITH CHECK (false)); -- Allow insert only
```

**Prisma middleware to set context (lib/db/client.ts):**
```typescript
// Source: https://medium.com/@dev0jsh/implement-audit-trail-on-postgresql-with-prisma-orm-1c32afb44ebd
import { PrismaClient } from "@prisma/client"
import { headers } from "next/headers"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ||
  new PrismaClient().$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        const headersList = headers()
        const tenantId = headersList.get("x-tenant-id")

        if (tenantId) {
          // Set session variable for RLS
          await query.$queryRaw`SELECT set_config('app.current_tenant_id', ${tenantId}::uuid, false)`
        }

        return query(args)
      },
    },
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

### Pattern 3: TOTP 2FA with Speakeasy

**What:** User enables TOTP (Time-based One-Time Password) during account setup; verified via authenticator app codes

**When to use:** After initial password login; required for healthcare compliance (AUD-02 implies strong auth)

**Setup endpoint (app/api/auth/totp/setup/route.ts):**
```typescript
// Source: https://dev.to/corbado/how-to-implement-totp-authentication-in-nextjs-secure-2fa-login-step-by-step-3aip
import { auth } from "@/auth"
import speakeasy from "speakeasy"
import QRCode from "qrcode"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MarketingOS (${session.user.email})`,
    issuer: "MarketingOS",
    length: 32,
  })

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Store secret temporarily (expires in 10 minutes)
  await db.totpSetup.create({
    data: {
      userId: session.user.id,
      secret: secret.base32,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  return Response.json({
    qrCode: qrCodeUrl,
    manualEntry: secret.base32,
  })
}
```

**Verification endpoint (app/api/auth/totp/verify/route.ts):**
```typescript
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { code } = await request.json()

  // Fetch temporary setup record
  const setup = await db.totpSetup.findFirst({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
  })

  if (!setup) {
    return Response.json({ error: "Setup expired" }, { status: 400 })
  }

  // Verify TOTP code (allow 30 seconds window for clock skew)
  const verified = speakeasy.totp.verify({
    secret: setup.secret,
    encoding: "base32",
    token: code,
    window: 2, // ±60 seconds
  })

  if (!verified) {
    return Response.json({ error: "Invalid code" }, { status: 400 })
  }

  // Enable 2FA and delete temporary setup
  await db.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: true, totpSecret: setup.secret },
  })

  await db.totpSetup.delete({ where: { id: setup.id } })

  return Response.json({ success: true })
}
```

**Login with 2FA (enhanced login action):**
```typescript
// After initial password verification, if user has TOTP enabled:
export async function verifyTotp(userId: string, code: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true },
  })

  if (!user?.totpSecret) {
    throw new Error("2FA not enabled for user")
  }

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: "base32",
    token: code,
    window: 2,
  })

  if (!verified) {
    throw new Error("Invalid 2FA code")
  }

  // Valid TOTP; now complete the session/login
  return true
}
```

### Pattern 4: Immutable Append-Only Audit Logs via Prisma Middleware

**What:** Capture every mutation (create/update/delete) with user context, resource type, action, and timestamp; stored immutably

**When to use:** Every operation for 7-year healthcare retention; middleware ensures no manual audit calls needed

**Schema (prisma/schema.prisma):**
```prisma
model AuditLog {
  id              String @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  userId          String    // Who did it
  userEmail       String    // Denormalized for queries without joins

  action          String    // create, update, delete, review, approve, reject
  resource        String    // model name (Content, ReviewDecision, etc.)
  resourceId      String    // which record

  changes         Json?     // before/after for updates
  metadata        Json?     // context (reason for approval, etc.)

  createdAt       DateTime  @default(now()) @db.Timestamp(3)
  // Note: NO update/delete fields; RLS policy enforces append-only

  @@index([organizationId])
  @@index([createdAt])
  @@index([userId])
  @@map("audit_logs")
}
```

**Prisma middleware (lib/db/client.ts):**
```typescript
// Source: https://www.prisma.io/blog/client-extensions-preview-8t3w27xkrxxn
export const db = globalForPrisma.prisma ||
  new PrismaClient().$extends({
    query: {
      async $allOperations({ operation, args, query, model }) {
        const headersList = headers()
        const tenantId = headersList.get("x-tenant-id")
        const userId = headersList.get("x-user-id")

        // Set RLS context
        if (tenantId) {
          await query.$queryRaw`SELECT set_config('app.current_tenant_id', ${tenantId}::uuid, false)`
        }

        const result = await query(args)

        // Log mutations (not reads)
        if (userId && tenantId && ["create", "update", "delete"].includes(operation)) {
          try {
            await logAuditEvent({
              organizationId: tenantId,
              userId,
              action: operation,
              resource: model || "unknown",
              resourceId: result.id || args.where?.id || "unknown",
              changes: operation === "update" ? args.data : undefined,
            })
          } catch (err) {
            console.error("Audit log failed (non-blocking):", err)
            // Don't throw; audit failure should not break user operation
          }
        }

        return result
      },
    },
  })

async function logAuditEvent({
  organizationId,
  userId,
  action,
  resource,
  resourceId,
  changes,
}: {
  organizationId: string
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: any
}) {
  // Use raw query to bypass audit middleware (prevent recursive logging)
  await db.$executeRaw`
    INSERT INTO audit_logs (
      organization_id, user_id, user_email, action, resource, resource_id, changes, created_at
    )
    VALUES (
      ${organizationId}, ${userId},
      (SELECT email FROM users WHERE id = ${userId}),
      ${action}, ${resource}, ${resourceId},
      ${changes ? JSON.stringify(changes) : null},
      NOW()
    )
  `
}
```

### Anti-Patterns to Avoid

- **Application-layer only tenant filtering:** Rely solely on WHERE clauses without RLS; a missed filter causes data leaks. Use RLS as defense-in-depth.
- **Storing plaintext passwords:** Always hash with bcrypt before insertion. Never store password in database without hashing.
- **TOTP secrets in environment:** Embed TOTP secrets in .env; they should be per-user in database. Environment is for shared app secrets only.
- **Audit logs with update/delete capability:** If audits can be modified, compliance trail is broken. Use RLS append-only policy.
- **No email verification:** Users might sign up with typos, creating orphaned accounts. Require email verification before granting access.
- **Session without expiration:** Sessions should expire to limit compromise window. 24 hours is healthcare standard.
- **Storing user ID in JWT without verification:** Token can be forged. Always verify token signature and check token expiry server-side.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email/password authentication | Custom session handler, token signing | Auth.js (next-auth) | Edge cases: token signing, CSRF, session timing, cookie security. Auth.js handles all. |
| Password hashing | SHA256 or custom hash | bcryptjs | Password hashing requires salting + cost factors. bcryptjs does this; custom hashing is insecure. |
| TOTP generation/verification | Custom TOTP logic | speakeasy + qrcode | TOTP has timing windows, encoding, and QR generation. speakeasy is battle-tested. |
| Multi-tenant data isolation | WHERE clauses in queries | PostgreSQL RLS | WHERE clauses can be forgotten or bypassed. RLS enforces at database level—no code can override. |
| Audit trail immutability | trigger with soft delete flag | PostgreSQL RLS policy (append-only) | Soft deletes still allow history rewrites. RLS append-only policies prevent all mutations. |
| Email verification tokens | Random strings with expiry check | Auth.js email provider or custom email table with TTL | Token generation requires crypto randomness, expiry management, and cleanup. Auth.js handles or use simple schema. |
| Organization role management | Hardcoded role checks | Prisma relations + enum (Creator, Reviewer, Admin) | Hardcoding doesn't scale; database relations allow querying permissions without code changes. |

**Key insight:** Authentication, encryption, and audit trails look deceptively simple but have decades of CVEs behind them. Use battle-tested libraries; custom implementations almost always have bypasses or edge cases that surface under stress.

## Common Pitfalls

### Pitfall 1: Setting Tenant Context Without SET LOCAL in Transactions
**What goes wrong:** In a connection pool (like pgBouncer or serverless databases), if tenant context is set but not reset, the next request re-uses the connection and inherits the previous tenant's ID. All queries leak data to the wrong tenant.

**Why it happens:** PostgreSQL session variables persist across queries in the same connection. In pooled environments, connections are reused across requests.

**How to avoid:** Use `SET LOCAL` which automatically resets at transaction end:
```sql
BEGIN;
SET LOCAL app.current_tenant_id = '...';
-- All queries in transaction see this tenant
COMMIT; -- Variable is automatically reset
```

**Warning signs:** Data appears to "belong" to wrong tenant intermittently; logs show cross-tenant queries; multi-tenant isolation tests pass in dev (direct connection) but fail in production (pooled).

**Verification step:** In integration tests, run concurrent requests with different tenants to same connection pool. Verify each request only sees its tenant's data.

### Pitfall 2: Audit Logs Not Captured for Role Changes
**What goes wrong:** Admin assigns user to new role, but audit log doesn't capture the before/after because you only logged the action, not the permission change. Cannot prove who approved the role change later.

**Why it happens:** Focusing on capturing mutations to content, forgetting that permission/role changes are also critical for audit.

**How to avoid:** Include permission mutations in audit scope. Log not just "user X assigned role Y" but track role removals too:
```typescript
// Log role grant
await logAuditEvent({
  action: "role_grant",
  resource: "user_role",
  resourceId: `${userId}:${roleId}`,
  changes: { role: roleId, grantedAt: now },
})

// And role removal
await logAuditEvent({
  action: "role_revoke",
  resource: "user_role",
  resourceId: `${userId}:${roleId}`,
  changes: { revokedAt: now },
})
```

**Warning signs:** Compliance audits find permission changes without corresponding audit events; unable to reproduce who approved a decision; gap in audit trail around sensitive actions.

### Pitfall 3: TOTP QR Code Shown in Logs / Slack
**What goes wrong:** Developer logs the QR code URL or base32 secret to Slack for debugging, exposing TOTP secret. Attacker can add 2FA code to their authenticator and impersonate user.

**Why it happens:** Secrets look innocuous in logs; developer wants to help user troubleshoot setup failure.

**How to avoid:** Never log secrets. If user loses access:
```typescript
// Bad: console.log(secret) in logs visible to others
console.log("TOTP secret:", secret.base32) // DO NOT DO

// Good: Backup codes (hashed) for account recovery
const backupCodes = Array.from({ length: 10 }, () => crypto.randomUUID())
await db.user.update({
  where: { id: userId },
  data: {
    backupCodeHashes: await Promise.all(
      backupCodes.map(code => hash(code))
    ),
  },
})
// Return to user once, never again
return { backupCodes } // Only in response, never in logs
```

**Warning signs:** Security audit flags secrets in logs; attacker gains access shortly after user enables 2FA; backup recovery codes requested frequently.

### Pitfall 4: Session Expiration Without Logout Cleanup
**What goes wrong:** User's session expires (24h) but they're still on the app. They try an action, it fails silently, then they manually log out. Later, audit shows their session ID for actions that happened after expiry, creating compliance confusion.

**Why it happens:** JWT expiry is server-side; client might not check token.exp before making request. Server rejects, but no UI feedback.

**How to avoid:** Check expiry client-side + provide clear UI:
```typescript
// Server action
export async function protectedAction() {
  const session = await auth()
  if (!session || new Date() > new Date(session.expires)) {
    // Session expired
    redirect("/auth/login?reason=session-expired")
  }
  // ... continue
}
```

**Warning signs:** Audit logs show successful operations after session expiry window; users report "suddenly logged out"; token.exp doesn't match session.expires on server.

### Pitfall 5: RLS Policy Doesn't Apply to Superuser
**What goes wrong:** You enable RLS and test with regular user account. Works perfectly. Then you query as superuser (or with `BYPASSRLS` role) for debugging and see all data. You forget to switch back and commit code that accidentally exposes all orgs.

**Why it happens:** PostgreSQL superusers always bypass RLS. This is by design (admins need escape hatch) but easy to forget.

**How to avoid:** Never query as superuser in application code. Create a separate app role without `BYPASSRLS`:
```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE app_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Do NOT grant BYPASSRLS or SUPERUSER
-- Test with this role, not postgres superuser

-- In Prisma connection string:
// DATABASE_URL="postgresql://app_user:password@localhost/app_db"
```

**Warning signs:** Tests pass locally but fail in production (dev uses superuser, prod uses app_user); RLS policies seem to have "holes"; you can query other org data when you shouldn't.

## Code Examples

Verified patterns from official sources and battle-tested implementations:

### Email Verification Flow
```typescript
// Source: https://authjs.dev/getting-started/authentication/email
// Sign up endpoint (app/api/auth/signup/route.ts)
export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  // Validate input
  if (!email || !password || password.length < 12) {
    return Response.json({ error: "Invalid input" }, { status: 400 })
  }

  // Check if user exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 })
  }

  // Hash password
  const passwordHash = await hash(password, 10)

  // Create user (unverified)
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: null, // Not verified yet
    },
  })

  // Generate verification token
  const verificationToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: verificationToken,
      expiresAt,
    },
  })

  // Send email (use your email provider)
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `Click here to verify: <a href="${verifyUrl}">${verifyUrl}</a>`,
  })

  return Response.json({ success: true, message: "Check your email" })
}

// Verification endpoint (app/auth/verify-email/route.ts)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return Response.json({ error: "No token" }, { status: 400 })
  }

  // Find and validate token
  const verification = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verification || verification.expiresAt < new Date()) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  // Mark user as verified
  await db.user.update({
    where: { id: verification.userId },
    data: { emailVerified: new Date() },
  })

  // Delete token
  await db.emailVerificationToken.delete({ where: { token } })

  redirect("/auth/login?verified=true")
}
```

### Role-Based Permission Check (Server Component)
```typescript
// Source: https://nextjs.org/docs/14/app/building-your-application/authentication
import { auth } from "@/auth"
import { db } from "@/lib/db/client"

export async function AdminPanel() {
  const session = await auth()

  if (!session?.user?.id) {
    return <div>Not authenticated</div>
  }

  // Fetch user's role in this organization
  const userOrg = await db.userOrganization.findFirst({
    where: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
    },
    include: { role: true },
  })

  // Check permission
  if (userOrg?.role.name !== "Admin") {
    return <div>Access denied. Admin role required.</div>
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Protected content */}
    </div>
  )
}
```

### CSV Export of Audit Logs (Server Action)
```typescript
// app/actions/export-audit-logs.ts
'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db/client"
import { headers } from "next/headers"

export async function exportAuditLogsAsCSV() {
  const session = await auth()
  const headersList = headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!session?.user?.id || !tenantId) {
    throw new Error("Unauthorized")
  }

  // Verify user is admin in this org
  const member = await db.userOrganization.findFirst({
    where: {
      userId: session.user.id,
      organizationId: tenantId,
      role: { name: "Admin" },
    },
  })

  if (!member) {
    throw new Error("Admin access required")
  }

  // Fetch audit logs (RLS automatically filters by tenantId via middleware)
  const logs = await db.auditLog.findMany({
    where: { organizationId: tenantId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  })

  // Convert to CSV
  const csv = [
    ["Timestamp", "User", "Action", "Resource", "Resource ID", "Changes"].join(","),
    ...logs.map((log) =>
      [
        log.createdAt.toISOString(),
        `"${log.user.email}"`,
        log.action,
        log.resource,
        log.resourceId,
        log.changes ? `"${JSON.stringify(log.changes)}"` : "",
      ].join(",")
    ),
  ].join("\n")

  // Return as file download
  return {
    csv,
    filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth.js v4 | Auth.js v5 | 2024-2025 | Major rewrite; v5 is fully typed, has better App Router support, simpler config. Still in beta but production-ready. |
| Session in localStorage | HttpOnly cookies + server components | 2023-2025 | Cookies prevent XSS theft; server components have native `auth()` function. Simpler mental model. |
| App-layer RBAC via middleware | RLS at database + app-layer together | 2024+ | RLS is now standard for multi-tenant isolation. App-layer alone leaves gaps. Defense-in-depth is best practice. |
| Magic links (passwordless) | Email + password (with 2FA required) | Healthcare trend 2025+ | Healthcare requires password control (password strength policies). Magic links are convenient but weaker for regulated industries. |
| Logging to external service | PostgreSQL `pgAudit` or triggers | 2025+ | pgAudit is simpler than shipping logs to Splunk/DataDog; keeps audit in database for compliance. Serverless-friendly. |
| Manual audit logging in code | Prisma middleware (automatic) | 2024+ | Middleware captures all mutations automatically; manual logging is error-prone and misses edge cases. |

**Deprecated/outdated:**
- **NextAuth.js v4 with Pages Router:** v5 with App Router is newer, has better TypeScript, recommended by Vercel. v4 still works but v5 is preferred.
- **Session stored in database:** JWT (stateless) is modern; database sessions require cleanup jobs. JWT is simpler for serverless.
- **Separate auth + app databases:** Shared database with RLS is now standard. Separate databases add complexity without gain.
- **Email verification via SMS codes:** TOTP via authenticator app is more user-friendly and doesn't depend on telecom. Still supports SMS as fallback.

## Open Questions

Things that couldn't be fully resolved in initial research:

1. **pgBouncer + SET LOCAL compatibility**
   - What we know: `SET LOCAL` resets at transaction end, which works with pgBouncer in transaction pooling mode. Connection pooling mode (reuse connections) may have issues.
   - What's unclear: Exact behavior with serverless Postgres (Neon, AWS RDS Proxy) which use transaction pooling. Need to test.
   - Recommendation: Implement `SET LOCAL` in migrations; test in staging environment with chosen Postgres provider. If issues, fallback to application-layer tenant context (less ideal but workable).

2. **Audit log retention: 7 years in PostgreSQL cost**
   - What we know: Healthcare requires 7-year retention (AUD-06). Audit logs grow ~100KB/user/month in heavy use.
   - What's unclear: Will storage costs scale acceptably? Should we archive older logs to S3?
   - Recommendation: Start with PostgreSQL, monitor usage. If approaching cost/performance limits, implement automated archival of logs >2 years old to S3 (keeping searchable index).

3. **2FA enforcement timing for new users**
   - What we know: Healthcare best practice requires 2FA. Question is when to enforce: at signup, at first login, or optional.
   - What's unclear: User friction vs. security tradeoff. Should we enforce immediately or give users 30 days?
   - Recommendation: Enforce 2FA setup after first login (immediate), but allow grace period for password-only access if user enrollment fails (fallback: email notification to admin).

4. **Email provider integration for verification emails**
   - What we know: Need to send verification emails (signup + password reset). Can use SendGrid, Resend, AWS SES, or others.
   - What's unclear: Which email provider to use? Resend is trendy, SendGrid is battle-tested, SES is cheap.
   - Recommendation: Placeholder implementation with console.log during dev, integrate Resend for production (modern API, good Next.js support). Decision deferred to Phase 2 (implementation).

5. **HIPAA audit log immutability vs. RLS append-only**
   - What we know: HIPAA requires immutable audit logs. RLS policy prevents UPDATE/DELETE via SQL.
   - What's unclear: Is RLS policy sufficient for "immutable" claim, or do we need additional mechanisms like WAL archival or blockchain-style hashing?
   - Recommendation: RLS append-only policy + WAL archival should be sufficient. For v1, rely on RLS. If auditors require additional proof, implement immutable sequence numbers or hash chains in Phase 2.

## Sources

### Primary (HIGH confidence)

- **Auth.js Official Docs:** https://authjs.dev/getting-started/installation
  - Installation steps, configuration, credential provider setup, JWT callbacks

- **Next.js 14 Authentication Guide:** https://nextjs.org/docs/14/app/building-your-application/authentication
  - App Router patterns, server components, session management, server actions

- **Prisma + Next.js Guide:** https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
  - Prisma Client instance management, Client Extensions, multi-database patterns

- **PostgreSQL Official RLS Docs:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - Row-level security policies, set_config usage, enforcement rules

- **AWS Multi-Tenant RLS Guide:** https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
  - RLS policy patterns for multi-tenant isolation, session variable setup

### Secondary (MEDIUM confidence)

- **WebFetch: Next.js 14 Authentication Patterns** (2026-01-21)
  - Email/password flow, password hashing with bcrypt, session management
  - Source: https://nextjs.org/docs/14/app/building-your-application/authentication

- **WebSearch: Multi-Tenant Architecture (2025-2026)**
  - Subdomain routing with middleware, dynamic tenant context
  - Source: https://medium.com/@sheharyarishfaq/subdomain-based-routing-in-nextjs-a-complete-multitenant-application

- **WebSearch: TOTP Implementation (2025-2026)**
  - speakeasy + qrcode for 2FA setup, verification windows
  - Source: https://dev.to/corbado/how-to-implement-totp-authentication-in-nextjs-secure-2fa-login-step-by-step-3aip

- **WebSearch: Prisma Audit Logging (2025-2026)**
  - Middleware-based audit capture, immutable append-only schemas
  - Source: https://medium.com/@dev0jsh/implement-audit-trail-on-postgresql-with-prisma-orm-1c32afb44ebd

### Tertiary (LOW confidence)

- **WebSearch: pgAudit vs Native Logging** (2025)
  - Comparison of audit logging approaches
  - Source: https://www.bytebase.com/blog/postgres-audit-logging/
  - *Note: Confirmed via https://neon.com/blog/postgres-logging-vs-pgaudit which validates pgAudit as standard for healthcare compliance*

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH - Auth.js v5 is official Next.js recommendation; Prisma + PostgreSQL are committed stack
- **Architecture Patterns:** HIGH - Patterns verified via official docs + recent tutorials (2025-2026)
- **Pitfalls:** MEDIUM - Identified via WebSearch + security best practices; some (like RLS with superuser) based on PostgreSQL documentation
- **2FA Implementation:** MEDIUM - speakeasy + TOTP pattern is widely used but specific healthcare 2FA requirements may evolve

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days for stable libraries; Auth.js v5 may shift if released as stable before then)

**Known gaps requiring validation:**
1. pgBouncer + SET LOCAL behavior in serverless Postgres (Neon, RDS Proxy)
2. 7-year audit log cost/performance model
3. Email provider selection (Resend vs. SendGrid vs. custom)
4. HIPAA auditor acceptance of RLS-based immutability claims

**Next steps for planner:**
- Confirm email provider choice before Phase 1 implementation (affects signup/verification flow)
- Test RLS + SET LOCAL with chosen Postgres provider in staging
- Design audit log retention policy (PostgreSQL vs. S3 archival cutoff)
