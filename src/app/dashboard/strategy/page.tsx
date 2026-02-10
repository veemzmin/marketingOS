import { AppShell } from "@/components/layout/AppShell"
import { StrategyIntake } from "@/components/strategy/StrategyIntake"

export default function StrategyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Strategy Intake</h1>
          <p className="mt-2 text-sm text-gray-600">
            Convert raw requests into a campaign plan, cadence, and testing roadmap.
          </p>
        </div>
        <StrategyIntake />
      </div>
    </AppShell>
  )
}
