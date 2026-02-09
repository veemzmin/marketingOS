import { AppShell } from "@/components/layout/AppShell"
import { SecuritySettingsClient } from "@/components/settings/SecuritySettingsClient"

export default function SecuritySettingsPage() {
  return (
    <AppShell>
      <SecuritySettingsClient />
    </AppShell>
  )
}
