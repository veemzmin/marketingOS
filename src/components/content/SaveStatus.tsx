'use client'

interface SaveStatusProps {
  state: 'idle' | 'saving' | 'saved' | 'error'
}

export function SaveStatus({ state }: SaveStatusProps) {
  if (state === 'idle') return null

  const stateConfig = {
    saving: { text: 'Saving...', className: 'text-blue-600' },
    saved: { text: 'Saved', className: 'text-green-600' },
    error: { text: 'Save failed', className: 'text-red-600' },
  }

  const config = stateConfig[state]
  return <span className={`text-sm ${config.className}`}>{config.text}</span>
}
