'use client'

import type { Violation } from '@/lib/governance/types'

interface GovernanceFeedbackProps {
  violations: Violation[]
  loading: boolean
  complianceScore: number | null
}

export function GovernanceFeedback({ violations, loading, complianceScore }: GovernanceFeedbackProps) {
  if (loading) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded p-4">
        <p className="text-blue-600">Checking compliance...</p>
      </div>
    )
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'gray'
    if (score >= 90) return 'green'
    if (score >= 70) return 'yellow'
    return 'red'
  }

  const scoreColor = getScoreColor(complianceScore)
  const scoreColorClasses = {
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    gray: 'bg-gray-400'
  }

  if (violations.length === 0) {
    return (
      <div className="border border-green-200 bg-green-50 rounded p-4">
        {complianceScore !== null && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Compliance Score</span>
              <span className="text-lg font-bold text-green-700">{complianceScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${scoreColorClasses[scoreColor]}`}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-green-700 font-medium">✓ No policy violations detected</p>
      </div>
    )
  }

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded p-4">
      {complianceScore !== null && (
        <div className="mb-3 pb-3 border-b border-yellow-300">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-yellow-900">Compliance Score</span>
            <span className="text-lg font-bold text-yellow-900">{complianceScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${scoreColorClasses[scoreColor]}`}
              style={{ width: `${complianceScore}%` }}
            />
          </div>
        </div>
      )}
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
