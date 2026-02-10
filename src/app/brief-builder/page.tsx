import { AppShell } from "@/components/layout/AppShell"
import { BriefBuilderLayout } from "@/components/brief/BriefBuilderLayout"

export default function BriefBuilderPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <BriefBuilderLayout />
      </div>
    </AppShell>
  )
}
