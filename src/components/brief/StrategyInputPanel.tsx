import Link from "next/link"
import type { StrategyRecommendation } from "@/app/actions/strategy"

const SIGNAL_LABELS: Record<string, string> = {
  launch: "Program Launch",
  "referral-enablement": "Referral Enablement",
  "trust-building": "Trust Building",
  compliance: "Compliance",
  "compliance-visibility": "Compliance Visibility",
  social: "Social Media",
  email: "Email",
  flyer: "Print/Flyer",
  "integration-of-care": "Integrated Care",
}

const ARCHETYPE_LABELS: Record<string, string> = {
  "program-launch": "Program Launch",
  "referral-enablement": "Referral Enablement",
  "trust-building": "Trust Building",
  "compliance-visibility": "Compliance Visibility",
}

export function StrategyInputPanel({ strategy }: { strategy: StrategyRecommendation }) {
  const analysis = strategy.analysis

  return (
    <div className="space-y-6 text-sm text-gray-700">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Strategy Inputs</h2>
        <p className="text-xs text-gray-500">Read-only summary from the intake engine.</p>
      </div>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Archetype
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {ARCHETYPE_LABELS[strategy.primaryArchetype] ?? strategy.primaryArchetype}
          </span>
          {strategy.secondaryArchetype && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {ARCHETYPE_LABELS[strategy.secondaryArchetype] ?? strategy.secondaryArchetype}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Detected Signals
        </div>
        <div className="flex flex-wrap gap-2">
          {strategy.detectedSignalKeys.map((key) => (
            <span
              key={key}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {SIGNAL_LABELS[key] ?? key}
            </span>
          ))}
          {strategy.detectedSignalKeys.length === 0 && (
            <span className="text-xs text-gray-400">No specific signals detected.</span>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Evidence
        </div>
        <div className="space-y-2">
          {Object.entries(strategy.evidence)
            .filter(([, terms]) => terms && terms.length > 0)
            .map(([key, terms]) => (
              <details
                key={key}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                  {SIGNAL_LABELS[key] ?? key}
                </summary>
                <p className="mt-2 text-xs text-gray-600">
                  {(terms as string[]).join(", ")}
                </p>
              </details>
            ))}
          {Object.keys(strategy.evidence).length === 0 && (
            <p className="text-xs text-gray-400">No evidence highlights logged.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Campaign Stack
        </div>
        <ol className="list-decimal space-y-1 pl-4">
          {strategy.stack.map((item, index) => (
            <li key={`${item}-${index}`} className="text-sm">
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cadence
        </div>
        <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">
            {analysis.cadenceRule.pattern.toUpperCase()}
          </div>
          <p className="text-xs text-gray-600">{analysis.cadenceRule.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            Email: {analysis.cadenceRule.emailFrequency}
          </div>
          <div className="text-xs text-gray-500">
            Social: {analysis.cadenceRule.socialFrequency}
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Link
          href="/dashboard/strategy"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Edit strategy inputs &gt;
        </Link>
      </div>
    </div>
  )
}
