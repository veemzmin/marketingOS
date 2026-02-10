"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { generateCampaignBrief } from "@/lib/brief/generate-brief"
import { generateDraftingPrompts, type DraftingPrompts } from "@/lib/brief/drafting-prompts"
import type { CampaignBrief } from "@/lib/brief/types"
import type { StrategyRecommendation } from "@/app/actions/strategy"
import { StrategyInputPanel } from "@/components/brief/StrategyInputPanel"
import { BriefPreviewPanel } from "@/components/brief/BriefPreviewPanel"
import { DraftingPromptsPanel } from "@/components/brief/DraftingPromptsPanel"
import { ExportControls } from "@/components/brief/ExportControls"

const PRIMARY_STORAGE_KEY = "lastStrategyRecommendation"
const FALLBACK_STORAGE_KEY = "marketingos:strategy-intake"
const BRIEF_ENGINE_VERSION = "1.0.0"

type LockedFieldKey = keyof CampaignBrief

function mergeLockedFields(
  nextBrief: CampaignBrief,
  previousBrief: CampaignBrief | null,
  lockedFields: Set<string>
): CampaignBrief {
  if (!previousBrief || lockedFields.size === 0) {
    return nextBrief
  }
  const merged: CampaignBrief = { ...nextBrief }
  lockedFields.forEach((field) => {
    if (field in previousBrief) {
      merged[field as LockedFieldKey] = previousBrief[field as LockedFieldKey] as never
    }
  })
  return merged
}

function getConfidenceColor(score: number) {
  if (score >= 75) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function getClarityClasses(level: "high" | "medium" | "low") {
  if (level === "high") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (level === "medium") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export function BriefBuilderLayout() {
  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null)
  const [brief, setBrief] = useState<CampaignBrief | null>(null)
  const [draftingPrompts, setDraftingPrompts] = useState<DraftingPrompts | null>(null)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const confidenceScore = strategy?.analysis.confidenceScore ?? 0
  const clarityLevel = strategy?.analysis.stakeholdersClarityLevel ?? "low"

  const confidenceBarClass = useMemo(
    () => getConfidenceColor(confidenceScore),
    [confidenceScore]
  )
  const lockedCount = lockedFields.size

  useEffect(() => {
    const loadStrategy = () => {
      try {
        let raw = window.localStorage.getItem(PRIMARY_STORAGE_KEY)
        if (!raw) {
          const fallback = window.localStorage.getItem(FALLBACK_STORAGE_KEY)
          if (fallback) {
            raw = fallback
            window.localStorage.setItem(PRIMARY_STORAGE_KEY, fallback)
          }
        }
        if (!raw) {
          setStrategy(null)
          return
        }
        const parsed = JSON.parse(raw) as StrategyRecommendation
        setStrategy(parsed)
      } catch (loadError) {
        console.error("Failed to load strategy intake", loadError)
        setError("Failed to load strategy intake. Please re-run Strategy Intake.")
        setStrategy(null)
      }
    }

    loadStrategy()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRIMARY_STORAGE_KEY || event.key === FALLBACK_STORAGE_KEY) {
        loadStrategy()
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const regenerateBrief = (options?: { existingVersion?: string }) => {
    if (!strategy) return
    try {
      const nextBrief = generateCampaignBrief({
        analysis: strategy.analysis,
        channels: strategy.channels,
        assets: strategy.assets,
        engineVersion: BRIEF_ENGINE_VERSION,
        existingVersion: options?.existingVersion,
      })
      const merged = mergeLockedFields(nextBrief, brief, lockedFields)
      const prompts = generateDraftingPrompts(
        merged,
        strategy.primaryArchetype,
        strategy.secondaryArchetype
      )
      setBrief(merged)
      setDraftingPrompts(prompts)
      setError(null)
    } catch (regenError) {
      console.error("Failed to regenerate brief", regenError)
      setError(
        regenError instanceof Error ? regenError.message : "Failed to regenerate brief."
      )
    }
  }

  useEffect(() => {
    if (!strategy) {
      setBrief(null)
      setDraftingPrompts(null)
      return
    }
    regenerateBrief({ existingVersion: brief?.meta.brief_version })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy])

  const handleToggleLock = (fieldKey: string) => {
    setLockedFields((prev) => {
      const next = new Set(prev)
      if (next.has(fieldKey)) {
        next.delete(fieldKey)
      } else {
        next.add(fieldKey)
      }
      return next
    })
  }

  if (!strategy || !brief || !draftingPrompts) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Campaign Brief Builder</h2>
        <p className="mt-2 text-sm text-gray-600">
          No strategy intake found. Run the Strategy Intake Engine first.
        </p>
        <Link
          href="/dashboard/strategy"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Go to Strategy Intake &gt;
        </Link>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Brief Builder</h1>
          <p className="text-sm text-gray-600">
            Review strategy outputs, lock fields, and export the brief.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:items-center lg:justify-end lg:flex-row">
          <div className="min-w-[220px]">
            <div className="text-xs font-semibold text-gray-500">Strategy Confidence</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${confidenceBarClass}`}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{confidenceScore}/100</span>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getClarityClasses(
              clarityLevel
            )}`}
          >
            Audience Clarity: {clarityLevel}
          </span>

          <div className="flex flex-col items-start gap-1">
            <button
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            onClick={() => regenerateBrief({ existingVersion: brief.meta.brief_version })}
            type="button"
          >
            Regenerate Unlocked Fields
            </button>
            <span className="text-[11px] text-gray-500">
              {lockedCount > 0
                ? `${lockedCount} field${lockedCount === 1 ? "" : "s"} locked`
                : "No locked fields yet"}
            </span>
          </div>
        </div>
      </div>

      <ExportControls brief={brief} draftingPrompts={draftingPrompts} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm lg:grid lg:grid-cols-[0.9fr_1.6fr] lg:divide-x">
        <div className="p-4 lg:max-h-[720px] lg:overflow-y-auto">
          <StrategyInputPanel strategy={strategy} />
        </div>

        <div className="p-4 lg:max-h-[720px] lg:overflow-y-auto">
          <BriefPreviewPanel
            brief={brief}
            lockedFields={lockedFields}
            onToggleLock={handleToggleLock}
          />
        </div>
      </div>

      <DraftingPromptsPanel draftingPrompts={draftingPrompts} />
    </div>
  )
}
