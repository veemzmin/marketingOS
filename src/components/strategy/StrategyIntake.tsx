"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFormState } from "react-dom"
import { analyzeStrategyAction } from "@/app/actions/strategy"

const initialState = null

export function StrategyIntake() {
  const [state, formAction] = useFormState(analyzeStrategyAction, initialState)
  const router = useRouter()
  const [audienceValue, setAudienceValue] = useState("")
  const [goalsValue, setGoalsValue] = useState("")
  const [cadenceValue, setCadenceValue] = useState("")

  useEffect(() => {
    if (!state) return
    try {
      localStorage.setItem("marketingos:strategy-intake", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to store strategy intake", error)
    }
  }, [state])

  const handleContinue = () => {
    if (!state) return
    try {
      localStorage.setItem("lastStrategyRecommendation", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to store strategy recommendation", error)
    }
    router.push("/brief-builder")
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form action={formAction} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Let&apos;s shape your campaign</h2>
          <p className="text-sm text-gray-600">
            Paste what you have &mdash; we&apos;ll help organize the rest.
          </p>
        </div>

        {state && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  🧭 We pulled a few starting points
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Based on what you pasted, these are common starting points.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  You can change any of these — they&apos;re just starting points.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!audienceValue && state.suggestedAudience[0]) {
                    setAudienceValue(state.suggestedAudience[0])
                  }
                  if (!goalsValue && state.suggestedGoals[0]) {
                    setGoalsValue(state.suggestedGoals[0])
                  }
                  if (!cadenceValue && state.suggestedCadence[0]) {
                    setCadenceValue(state.suggestedCadence[0])
                  }
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Apply suggested set
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs text-gray-700">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Audience
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.suggestedAudience.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAudienceValue(item)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Goals
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.suggestedGoals.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGoalsValue(item)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cadence
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.suggestedCadence.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCadenceValue(item)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Intake Text</span>
          <textarea
            name="intakeText"
            required
            rows={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="Paste the message thread or notes here..."
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Additional Ideas (optional)</span>
          <textarea
            name="ideasText"
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="Drop rough ideas, fragments, or thoughts here..."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-700">Industry</span>
            <input
              name="industry"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Mental Health / SUD"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-700">Audience</span>
            <input
              name="audience"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Patients, families, clinicians"
              value={audienceValue}
              onChange={(event) => setAudienceValue(event.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Goals</span>
          <input
            name="goals"
            className="rounded-md border border-gray-300 px-3 py-2"
            placeholder="Increase program awareness and enrollments"
            value={goalsValue}
            onChange={(event) => setGoalsValue(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Cadence Preference (optional)</span>
          <input
            name="cadence"
            className="rounded-md border border-gray-300 px-3 py-2"
            placeholder="e.g., 3x/week social + 1 email/week"
            value={cadenceValue}
            onChange={(event) => setCadenceValue(event.target.value)}
          />
        </label>

        <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Generate Plan
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Recommended Plan</h3>
        {!state && (
          <p className="mt-3 text-sm text-gray-600">
            Submit an intake to generate a campaign recommendation.
          </p>
        )}
        {state && (
          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="text-xs font-semibold text-blue-700">
                Next step: Build the campaign brief
              </div>
              <div className="mt-1 text-xs text-blue-600">
                Lock key fields, review compliance notes, and export a draft-ready brief.
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Continue to Brief Builder
              </button>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Summary</div>
              <p className="mt-1">{state.summary}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Signals Detected</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {state.detectedSignalKeys.map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
                  >
                    {key}
                  </span>
                ))}
                {state.detectedSignalKeys.length === 0 && (
                  <span className="text-gray-400 text-xs">No specific signals detected</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Confidence Score</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${state.confidenceScore}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{state.confidenceScore}/100</span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Audience Clarity</div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={
                    state.stakeholdersClarityLevel === "high"
                      ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200"
                      : state.stakeholdersClarityLevel === "medium"
                        ? "rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200"
                        : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200"
                  }
                >
                  {state.stakeholdersClarityLevel}
                </span>
                <span className="text-xs text-gray-500">
                  {state.stakeholdersClarityLevel === "high"
                    ? "Audience well-defined"
                    : state.stakeholdersClarityLevel === "medium"
                      ? "Audience partially defined"
                      : "Audience unclear - review MIQ-01"}
                </span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Cadence</div>
              <p className="mt-1">{state.recommendedCadence}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Why This Cadence</div>
              <p className="mt-1 text-gray-700">{state.cadenceRationale}</p>
              {Object.keys(state.evidence).length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Evidence highlights
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {Object.entries(state.evidence)
                      .filter(([, terms]) => terms && terms.length > 0)
                      .slice(0, 3)
                      .map(([key, terms]) => (
                        <li key={key} className="text-xs text-gray-600">
                          <span className="font-medium">{key}:</span>{" "}
                          {(terms as string[]).slice(0, 3).join(", ")}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Channels</div>
              <ul className="mt-1 list-disc pl-4">
                {state.channels.map((channel) => (
                  <li key={channel}>{channel}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Campaign Stack</div>
              <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                {state.stack.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Assets</div>
              <ul className="mt-1 list-disc pl-4">
                {state.assets.map((asset) => (
                  <li key={asset}>{asset}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Experiments</div>
              <ul className="mt-1 list-disc pl-4">
                {state.experiments.map((experiment) => (
                  <li key={experiment.id}>
                    <span className="font-mono text-xs text-gray-500">{experiment.id}</span>{" "}
                    {experiment.name}{" "}
                    <span className="text-gray-400">[{experiment.safetyClass}]</span>
                  </li>
                ))}
              </ul>
            </div>
            {(state.risks.length > 0 ||
              state.requiresVisibilityArchive ||
              state.requiresApprovalWorkflow) && (
              <div>
                <div className="font-semibold text-gray-900">Risks & Notes</div>
                {state.risks.length > 0 && (
                  <ul className="mt-1 list-disc pl-4">
                    {state.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                )}
                {state.requiresVisibilityArchive && (
                  <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <span className="font-semibold">Archive / Visibility required:</span>{" "}
                    Compliance or reporting signals detected. Content related to compliance, annual
                    reports, or stakeholder visibility should be archived and documented.
                  </div>
                )}
                {state.requiresApprovalWorkflow && (
                  <div className="mt-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800">
                    <span className="font-semibold">Approval gates required:</span> Explicit
                    approval or sign-off language detected. All deliverables must pass a documented
                    approval checkpoint before publish.
                  </div>
                )}
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900">Next Steps</div>
              <ul className="mt-1 list-disc pl-4">
                {state.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Planner Prompt</div>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                {state.plannerPrompt}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
