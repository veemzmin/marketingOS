import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { headers } from 'next/headers'
import {
  createResearchProjectAction,
  startResearchRunAction,
  completeResearchRunAction,
  refreshResearchSourcesAction,
} from '@/lib/actions/research'

const industryOptions = [
  'Mental Health/Substance Abuse',
  'Food/Restaurant',
  'Cannabis',
  'Healthcare',
  'Graphic Design/Marketing/Advertising Agency',
]

const outputOrder = [
  'EXEC_SUMMARY',
  'FULL_REPORT',
  'SLIDE_OUTLINE',
  'DATA_APPENDIX',
  'ACTION_PLAN',
  'IDEAS',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value: Date) {
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams?: { runId?: string; projectId?: string }
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  const headersList = await headers()
  let organizationId = headersList.get('x-tenant-id')

  if (!organizationId && session.user?.id) {
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    organizationId = userOrg?.organizationId || null
  }

  if (!organizationId) {
    redirect('/unauthorized')
  }

  const projects = await prisma.researchProject.findMany({
    where: { organizationId },
    include: {
      runs: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const selectedProjectId = searchParams?.projectId || projects[0]?.id || ''
  const selectedProject = projects.find((project) => project.id === selectedProjectId)

  const recentRuns = await prisma.researchRun.findMany({
    where: { project: { organizationId } },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  let activeRun = null
  if (searchParams?.runId) {
    activeRun = await prisma.researchRun.findUnique({
      where: { id: searchParams.runId },
      include: {
        project: true,
        outputs: { orderBy: { createdAt: 'asc' } },
        sources: { orderBy: { createdAt: 'asc' } },
      },
    })
  } else if (selectedProjectId) {
    activeRun = await prisma.researchRun.findFirst({
      where: { projectId: selectedProjectId },
      include: {
        project: true,
        outputs: { orderBy: { createdAt: 'asc' } },
        sources: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (activeRun?.project.organizationId !== organizationId) {
    activeRun = null
  }

  const sourceLibrary = selectedProject
    ? await prisma.knowledgeEntry.findMany({
        where: {
          organizationId,
          category: `industry:${slugify(selectedProject.industry)}`,
        },
        orderBy: { lastVerified: 'desc' },
        take: 15,
      })
    : []

  const runQuestions = Array.isArray(activeRun?.questions)
    ? (activeRun?.questions as string[])
    : []

  const runOutputs = (activeRun?.outputs || []).slice().sort((a, b) => {
    return outputOrder.indexOf(a.outputType) - outputOrder.indexOf(b.outputType)
  })

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Research Command Center</h1>
        <p className="text-gray-600">
          CEO-level prompts in, research-ready outputs out. Build industry-specific
          intelligence, campaigns, and action plans with citations.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Research Project</h2>
          <form action={createResearchProjectAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title
              </label>
              <input
                name="projectTitle"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Launch: Cannabis Wellness Brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                name="projectIndustry"
                className="w-full rounded border border-gray-300 px-3 py-2"
                list="industry-options"
                placeholder="Select or type an industry"
                required
              />
              <datalist id="industry-options">
                {industryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="projectDescription"
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Brief context, constraints, or strategic notes."
              />
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Project
            </button>
          </form>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Launch Research Run</h2>
          <form action={startResearchRunAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                name="projectId"
                className="w-full rounded border border-gray-300 px-3 py-2"
                defaultValue={selectedProjectId}
                required
              >
                <option value="" disabled>
                  Select project
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.industry})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEO Prompt
              </label>
              <textarea
                name="prompt"
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={4}
                placeholder="Example: Build a 90-day go-to-market plan to launch a new mental health teletherapy offering that can go viral."
                required
              />
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              disabled={projects.length === 0}
            >
              Start Research Run
            </button>
            {projects.length === 0 && (
              <p className="text-sm text-gray-500">
                Add a project first to launch a research run.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No research projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded border border-gray-200 px-3 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{project.title}</div>
                      <div className="text-xs text-gray-500">{project.industry}</div>
                    </div>
                    <Link
                      href={`/dashboard/research?projectId=${project.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View
                    </Link>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {project.runs.length} recent runs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Recent Runs</h2>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-gray-500">No research runs yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded border border-gray-200 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{run.project.title}</div>
                    <div className="text-xs text-gray-500">
                      {run.project.industry} - {run.status} - {formatDate(run.createdAt)}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/research?runId=${run.id}&projectId=${run.projectId}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Run</h2>
            <p className="text-sm text-gray-500">
              {activeRun
                ? `${activeRun.project.title} - ${activeRun.project.industry} - ${activeRun.status}`
                : 'Select a run to view outputs.'}
            </p>
          </div>
          {activeRun && (
            <div className="text-xs text-gray-500">Created {formatDate(activeRun.createdAt)}</div>
          )}
        </div>

        {!activeRun && (
          <p className="text-sm text-gray-500">No active run selected.</p>
        )}

        {activeRun && (
          <div className="space-y-6">
            <div className="rounded border border-gray-200 px-4 py-3">
              <div className="text-xs uppercase text-gray-500">Prompt</div>
              <p className="text-sm text-gray-800 mt-2">{activeRun.prompt}</p>
            </div>

            {activeRun.status === 'PENDING' && runQuestions.length > 0 && (
              <div className="rounded border border-blue-100 bg-blue-50 px-4 py-4">
                <h3 className="text-sm font-semibold text-blue-900">Clarifying Questions</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Answer these to generate research outputs.
                </p>
                <form action={completeResearchRunAction} className="space-y-4 mt-4">
                  <input type="hidden" name="runId" value={activeRun.id} />
                  {runQuestions.map((question, index) => (
                    <div key={question}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {question}
                      </label>
                      <textarea
                        name={`answer-${index}`}
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        rows={2}
                        placeholder="Add your answer"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Generate Outputs
                  </button>
                </form>
              </div>
            )}

            {activeRun.status === 'COMPLETED' && runOutputs.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {runOutputs.map((output) => (
                    <details
                      key={output.id}
                      className="rounded border border-gray-200 px-4 py-3"
                      open={output.outputType === 'EXEC_SUMMARY'}
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                        {output.outputType.replace('_', ' ')}
                      </summary>
                      <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
                        {output.content}
                      </pre>
                    </details>
                  ))}
                </div>

                <div className="rounded border border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Sources</h3>
                  {activeRun.sources.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">
                      No sources stored for this run.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      {activeRun.sources.map((source, index) => (
                        <div key={source.id} className="rounded border border-gray-100 px-3 py-2">
                          <div className="font-medium">
                            [{index + 1}] {source.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {source.publisher || 'Unknown publisher'} - {source.sourceType}
                          </div>
                          {source.summary && (
                            <div className="text-xs text-gray-600 mt-1">{source.summary}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeRun.status === 'FAILED' && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This run failed. Please retry with a new prompt or adjust inputs.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Source Library</h2>
            <p className="text-sm text-gray-500">
              {selectedProject
                ? `Industry sources for ${selectedProject.industry}.`
                : 'Select a project to view sources.'}
            </p>
          </div>
          {selectedProject && (
            <form action={refreshResearchSourcesAction}>
              <input type="hidden" name="projectId" value={selectedProject.id} />
              <button
                type="submit"
                className="rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Refresh Sources
              </button>
            </form>
          )}
        </div>

        {!selectedProject && (
          <p className="text-sm text-gray-500">No project selected.</p>
        )}

        {selectedProject && sourceLibrary.length === 0 && (
          <p className="text-sm text-gray-500">No sources ingested yet.</p>
        )}

        {selectedProject && sourceLibrary.length > 0 && (
          <div className="space-y-2 text-sm text-gray-700">
            {sourceLibrary.map((entry) => (
              <div key={entry.id} className="rounded border border-gray-100 px-3 py-2">
                <div className="font-medium">{entry.claim}</div>
                <div className="text-xs text-gray-500">{entry.source}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
