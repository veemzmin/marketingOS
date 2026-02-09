"use client"

import { useState } from "react"
import { logger } from "@/lib/logger"

interface Violation {
  policyId: string
  severity: string
  text: string
  explanation: string
}

export function GovernanceTestClient() {
  const [content, setContent] = useState("")
  const [clientId, setClientId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    complianceScore: number
    violations: Violation[]
    reasoning: string[]
    passed: string[]
  } | null>(null)

  const handleValidate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/governance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          clientId: clientId || undefined,
          profileId: profileId || undefined,
          campaignId: campaignId || undefined,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      logger.error("Validation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Governance Engine Test</h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Client ID (optional)
              </label>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="clientId"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Profile ID (optional)
              </label>
              <input
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="profileId"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Campaign ID (optional)
              </label>
              <input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="campaignId"
              />
            </div>
          </div>
          <label className="block mb-2 font-medium">Content to Validate</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
            placeholder="Enter content to test governance validation..."
          />
          <button
            onClick={handleValidate}
            disabled={loading || !content}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Validating..." : "Validate Content"}
          </button>
        </div>

        <div>
          {result && (
            <div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-bold mb-2">
                  Compliance Score: {result.complianceScore}/100
                </h2>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      result.complianceScore >= 80
                        ? "bg-green-500"
                        : result.complianceScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${result.complianceScore}%` }}
                  />
                </div>
                <div className="mt-4 text-sm">
                  <p className="font-medium mb-2">Score Breakdown:</p>
                  <ul className="space-y-1">
                    {result.reasoning.map((reason, i) => (
                      <li key={i} className="text-gray-700">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold mb-2">
                  Violations ({result.violations.length})
                </h3>
                {result.violations.length === 0 ? (
                  <p className="text-green-600">No violations found!</p>
                ) : (
                  <div className="space-y-3">
                    {result.violations.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 bg-red-50 border-l-4 border-red-500 rounded"
                      >
                        <p className="font-medium text-sm text-red-800">
                          {v.policyId} ({v.severity})
                        </p>
                        <p className="text-sm text-gray-700 mt-1 italic">
                          &quot;{v.text}&quot;
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{v.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold mb-2 text-green-700">
                  Passed Policies ({result.passed.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.passed.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-3">Quick Test Cases</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() =>
              setContent(
                "Our new treatment cures depression and anxiety in just 2 weeks! Contact us today."
              )
            }
            className="p-2 bg-white border rounded text-sm hover:bg-gray-50"
          >
            Medical Claims Violation
          </button>
          <button
            onClick={() =>
              setContent("Many addicts and junkies struggle with mental health issues.")
            }
            className="p-2 bg-white border rounded text-sm hover:bg-gray-50"
          >
            Stigma Language Violation
          </button>
          <button
            onClick={() =>
              setContent("If you are feeling suicidal, please know you are not alone.")
            }
            className="p-2 bg-white border rounded text-sm hover:bg-gray-50"
          >
            Suicide Safety Violation
          </button>
          <button
            onClick={() =>
              setContent(
                "Therapy may help reduce symptoms of depression and anxiety when combined with other treatments."
              )
            }
            className="p-2 bg-white border rounded text-sm hover:bg-gray-50"
          >
            Compliant Content
          </button>
        </div>
      </div>
    </div>
  )
}
