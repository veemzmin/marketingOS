"use client"

import { useMemo, useState } from "react"
import type { CampaignBrief } from "@/lib/brief/types"
import type { DraftingPrompts } from "@/lib/brief/drafting-prompts"
import {
  buildClipboardPayload,
  exportBriefAsJSON,
  exportBriefAsMarkdown,
  generateExportFilename,
} from "@/lib/brief/export"

type ExportControlsProps = {
  brief: CampaignBrief
  draftingPrompts: DraftingPrompts
}

type CopyKey = "brief" | "promptA" | "promptB" | "promptC"

export function ExportControls({ brief, draftingPrompts }: ExportControlsProps) {
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualCopy, setManualCopy] = useState<{ label: string; text: string } | null>(
    null
  )

  const promptButtons = useMemo(
    () => [
      {
        key: "promptA" as const,
        label: "Prompt A - 2-Week Micro-Sequence",
        prompt: draftingPrompts.promptA,
        visible: true,
      },
      {
        key: "promptB" as const,
        label: "Prompt B - Provider Enablement Kit",
        prompt: draftingPrompts.promptB,
        visible: draftingPrompts.promptB !== null,
      },
      {
        key: "promptC" as const,
        label: "Prompt C - Compliance Visibility Snapshot",
        prompt: draftingPrompts.promptC,
        visible: draftingPrompts.promptC !== null,
      },
    ],
    [draftingPrompts]
  )

  const handleCopy = async (text: string, key: CopyKey, label: string) => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        setManualCopy({ label, text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 2000)
    } catch (copyError) {
      console.error("Clipboard copy failed", copyError)
      setManualCopy({ label, text })
    }
  }

  const triggerDownload = (content: string, filename: string, type: string) => {
    try {
      const blob = new Blob([content], { type })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      console.error("Export failed", downloadError)
      setError("Export failed. Please try again.")
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label="Download campaign brief as JSON"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() =>
            triggerDownload(
              exportBriefAsJSON(brief),
              generateExportFilename(brief, "json"),
              "application/json"
            )
          }
        >
          Export JSON
        </button>
        <button
          type="button"
          aria-label="Download campaign brief as Markdown"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() =>
            triggerDownload(
              exportBriefAsMarkdown(brief),
              generateExportFilename(brief, "md"),
              "text/markdown"
            )
          }
        >
          Export Markdown
        </button>
        <button
          type="button"
          aria-label="Copy campaign brief to clipboard"
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          onClick={() =>
            handleCopy(exportBriefAsMarkdown(brief), "brief", "Campaign Brief")
          }
        >
          <span aria-live="polite">
            {copiedKey === "brief" ? "Copied!" : "Copy Brief"}
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {promptButtons
          .filter((button) => button.visible)
          .map((button) => (
            <button
              key={button.key}
              type="button"
              aria-label={`Copy ${button.label}`}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() =>
                handleCopy(
                  buildClipboardPayload(button.prompt as string, button.label),
                  button.key,
                  button.label
                )
              }
            >
              <span aria-live="polite">
                {copiedKey === button.key
                  ? "Copied!"
                  : `Copy ${button.label.split(" - ")[0].trim()}`}
              </span>
            </button>
          ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {manualCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900">
              Clipboard not available. Please copy the text below manually.
            </h3>
            <p className="mt-1 text-xs text-gray-500">{manualCopy.label}</p>
            <textarea
              className="mt-3 h-48 w-full rounded-md border border-gray-200 p-3 text-xs text-gray-700"
              value={manualCopy.text}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                onClick={() => setManualCopy(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
