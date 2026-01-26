'use client'

import type { Violation } from '@/lib/governance/types'

interface GovernanceFeedbackProps {
  violations: Violation[]
  loading: boolean
}

export function GovernanceFeedback({ violations, loading }: GovernanceFeedbackProps) {
  if (loading) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded p-4">
        <p className="text-blue-600">Checking compliance...</p>
      </div>
    )
  }

  if (violations.length === 0) {
    return (
      <div className="border border-green-200 bg-green-50 rounded p-4">
        <p className="text-green-700 font-medium">✓ No policy violations detected</p>
      </div>
    )
  }

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded p-4">
      <h3 className="font-semibold text-yellow-900 mb-2">
        {violations.length} Policy Violation{violations.length !== 1 ? 's' : ''}
      </h3>
      <ul className="space-y-3">
        {violations.map((v, idx) => (
          <li key={`${v.policyId}-${idx}`} className="text-sm">
            <div className="font-medium text-yellow-800">{v.policyId}</div>
            <div className="text-yellow-700">{v.explanation}</div>
            {v.text && (
              <div className="text-yellow-600 italic mt-1">Found: "{v.text}"</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
