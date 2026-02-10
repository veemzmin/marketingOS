"use client"

import { useFormState } from "react-dom"
import { analyzeStrategyAction } from "@/app/actions/strategy"

const initialState = null

export function StrategyIntake() {
  const [state, formAction] = useFormState(analyzeStrategyAction, initialState)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form action={formAction} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Campaign Intake</h2>
          <p className="text-sm text-gray-600">
            Paste a message, email, or chat. We&apos;ll recommend cadence, channels, and tests.
          </p>
        </div>

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
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Goals</span>
          <input
            name="goals"
            className="rounded-md border border-gray-300 px-3 py-2"
            placeholder="Increase program awareness and enrollments"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700">Cadence Preference (optional)</span>
          <input
            name="cadence"
            className="rounded-md border border-gray-300 px-3 py-2"
            placeholder="e.g., 3x/week social + 1 email/week"
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
            <div>
              <div className="font-semibold text-gray-900">Summary</div>
              <p className="mt-1">{state.summary}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Cadence</div>
              <p className="mt-1">{state.recommendedCadence}</p>
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
                  <li key={experiment}>{experiment}</li>
                ))}
              </ul>
            </div>
            {state.risks.length > 0 && (
              <div>
                <div className="font-semibold text-gray-900">Risks & Notes</div>
                <ul className="mt-1 list-disc pl-4">
                  {state.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
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
