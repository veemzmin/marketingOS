type BriefFieldBlockProps = {
  fieldKey: string
  label: string
  isLocked: boolean
  onToggleLock: () => void
  children: React.ReactNode
}

function LockClosedIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 11c1.1 0 2 .9 2 2v2a2 2 0 11-4 0v-2c0-1.1.9-2 2-2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h1V9a3 3 0 016 0v2h1a2 2 0 012 2z"
      />
    </svg>
  )
}

function LockOpenIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 11V9a5 5 0 019.9-1M12 11c1.1 0 2 .9 2 2v2a2 2 0 11-4 0v-2c0-1.1.9-2 2-2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z"
      />
    </svg>
  )
}

export function BriefFieldBlock({
  label,
  isLocked,
  onToggleLock,
  children,
}: BriefFieldBlockProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${isLocked ? "border-slate-300 bg-slate-50" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <button
          type="button"
          onClick={onToggleLock}
          title={
            isLocked
              ? "This field is locked and will not regenerate automatically."
              : "Click to lock this field."
          }
          className="rounded-md border border-transparent p-1 text-gray-500 hover:bg-gray-100"
        >
          {isLocked ? <LockClosedIcon /> : <LockOpenIcon />}
        </button>
      </div>
      <div className="mt-3 text-sm text-gray-700">{children}</div>
    </div>
  )
}
