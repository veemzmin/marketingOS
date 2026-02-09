import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/permissions"
import { addKnowledgeEntry } from "@/lib/ai/knowledge-base"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function getOrganizationId() {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")
  if (tenantId) return tenantId

  const session = await auth()
  if (!session?.user?.id) return null

  const userOrg = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  })
  return userOrg?.organizationId || null
}

export default async function IndustryProfilesPage() {
  await requireAdmin()

  const organizationId = await getOrganizationId()
  if (!organizationId) {
    redirect("/unauthorized")
  }

  const [clients, knowledgeEntries] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      include: {
        governanceProfiles: true,
        campaigns: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.knowledgeEntry.findMany({
      where: { organizationId },
      orderBy: { lastVerified: "desc" },
      take: 25,
    }),
  ])

  async function createClient(formData: FormData) {
    "use server"
    const orgId = await getOrganizationId()
    if (!orgId) redirect("/unauthorized")

    const name = String(formData.get("clientName") || "").trim()
    const slugInput = String(formData.get("clientSlug") || "").trim()
    if (!name) return

    const slug = slugInput ? slugify(slugInput) : slugify(name)
    await prisma.client.create({
      data: {
        organizationId: orgId,
        name,
        slug,
      },
    })

    revalidatePath("/dashboard/industry-profiles")
  }

  async function createProfile(formData: FormData) {
    "use server"
    const orgId = await getOrganizationId()
    if (!orgId) redirect("/unauthorized")

    const clientId = String(formData.get("profileClientId") || "")
    const name = String(formData.get("profileName") || "").trim()
    const description = String(formData.get("profileDescription") || "").trim()
    const configRaw = String(formData.get("profileConfig") || "{}").trim()
    const isActive = formData.get("profileActive") === "on"

    if (!clientId || !name) return

    let config = {}
    try {
      config = configRaw ? JSON.parse(configRaw) : {}
    } catch {
      config = {}
    }

    await prisma.governanceProfile.create({
      data: {
        clientId,
        name,
        description: description || null,
        isActive,
        config,
      },
    })

    revalidatePath("/dashboard/industry-profiles")
  }

  async function createCampaign(formData: FormData) {
    "use server"
    const orgId = await getOrganizationId()
    if (!orgId) redirect("/unauthorized")

    const clientId = String(formData.get("campaignClientId") || "")
    const profileId = String(formData.get("campaignProfileId") || "")
    const name = String(formData.get("campaignName") || "").trim()
    const status = String(formData.get("campaignStatus") || "DRAFT")
    const templatesRaw = String(formData.get("campaignTemplates") || "").trim()

    if (!clientId || !profileId || !name) return

    let config = {}
    if (templatesRaw) {
      try {
        config = { templates: JSON.parse(templatesRaw) }
      } catch {
        config = {}
      }
    }

    await prisma.campaign.create({
      data: {
        clientId,
        governanceProfileId: profileId,
        name,
        status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        config,
      },
    })

    revalidatePath("/dashboard/industry-profiles")
  }

  async function createKnowledgeEntry(formData: FormData) {
    "use server"
    const orgId = await getOrganizationId()
    if (!orgId) redirect("/unauthorized")

    const category = String(formData.get("knowledgeCategory") || "").trim()
    const claim = String(formData.get("knowledgeClaim") || "").trim()
    const source = String(formData.get("knowledgeSource") || "").trim()

    if (!category || !claim || !source) return

    await addKnowledgeEntry(orgId, { category, claim, source })
    revalidatePath("/dashboard/industry-profiles")
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Industry Profiles</h1>
        <p className="text-gray-600">
          Create client-specific governance profiles, campaigns, and knowledge entries.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Client</h2>
          <form action={createClient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                name="clientName"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Acme Health"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Slug (optional)
              </label>
              <input
                name="clientSlug"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="acme-health"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Client
            </button>
          </form>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Governance Profile</h2>
          <form action={createProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                name="profileClientId"
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name
              </label>
              <input
                name="profileName"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Mental Health Compliance"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                name="profileDescription"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Ruleset for healthcare marketing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Config JSON
              </label>
              <textarea
                name="profileConfig"
                className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                rows={4}
                placeholder='{"rules": ["medical-claims","stigma-language"]}'
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="profileActive" defaultChecked />
              Active
            </label>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Profile
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Create Campaign</h2>
        <form action={createCampaign} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              name="campaignClientId"
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Governance Profile
            </label>
            <select
              name="campaignProfileId"
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select profile</option>
              {clients.flatMap((client) =>
                client.governanceProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {client.name} — {profile.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              name="campaignName"
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Spring Awareness"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="campaignStatus"
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Templates JSON (optional)
            </label>
            <textarea
              name="campaignTemplates"
              className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
              rows={4}
              placeholder='[{"id":"ig-awareness","name":"IG Awareness","contentType":"social","platform":"instagram","bodyTemplate":"..."}]'
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Campaign
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
        <form action={createKnowledgeEntry} className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              name="knowledgeCategory"
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="statistic"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim
            </label>
            <input
              name="knowledgeClaim"
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Example claim for industry knowledge base"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <input
              name="knowledgeSource"
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Source URL or citation"
              required
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Knowledge Entry
            </button>
          </div>
        </form>
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Recent Entries
          </h3>
          {knowledgeEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No entries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700">
              {knowledgeEntries.map((entry) => (
                <li key={entry.id} className="rounded border border-gray-200 px-3 py-2">
                  <div className="font-medium">{entry.claim}</div>
                  <div className="text-xs text-gray-500">
                    {entry.category} • {entry.source}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Clients</h2>
        {clients.length === 0 ? (
          <p className="text-sm text-gray-500">No clients yet.</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="rounded border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{client.name}</div>
                    <div className="text-xs text-gray-500">Slug: {client.slug}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {client.governanceProfiles.length} profiles • {client.campaigns.length} campaigns
                  </div>
                </div>
                {client.governanceProfiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-700">
                    Profiles: {client.governanceProfiles.map((p) => p.name).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
