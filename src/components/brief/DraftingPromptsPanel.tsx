"use client"

import { useState } from "react"
import type { DraftingPrompts } from "@/lib/brief/drafting-prompts"

type PromptCardProps = {
  title: string
  subtitle: string
  prompt: string
  onCopy: () => Promise<void>
  copied: boolean
}

function PromptCard({ title, subtitle, prompt, onCopy, copied }: PromptCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          {copied ? "Copied!" : `Copy ${title.split(" - ")[0].trim()}`}
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-700">
        {prompt}
      </pre>
    </div>
  )
}

export function DraftingPromptsPanel({ draftingPrompts }: { draftingPrompts: DraftingPrompts }) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)

  const handleCopy = async (key: "A" | "B" | "C", prompt: string) => {
    if (!navigator.clipboard || !window.isSecureContext) {
      window.prompt("Copy the prompt below:", prompt)
      return
    }
    await navigator.clipboard.writeText(prompt)
    setCopiedPrompt(key)
    window.setTimeout(() => setCopiedPrompt(null), 2000)
  }

  const hasPromptB = Boolean(draftingPrompts.promptB)
  const hasPromptC = Boolean(draftingPrompts.promptC)

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Drafting Prompts</h2>
        <p className="text-xs text-gray-500">
          Use these prompts with GPT-4 or equivalent for production-ready drafts.
        </p>
      </div>

      <PromptCard
        title="Prompt A - 2-Week Micro-Sequence"
        subtitle="Always generated. Use to produce a 2-week post calendar."
        prompt={draftingPrompts.promptA}
        onCopy={() => handleCopy("A", draftingPrompts.promptA)}
        copied={copiedPrompt === "A"}
      />

      {draftingPrompts.promptB && (
        <PromptCard
          title="Prompt B - Provider Enablement Kit"
          subtitle="Generated because referral archetype detected."
          prompt={draftingPrompts.promptB}
          onCopy={() => handleCopy("B", draftingPrompts.promptB as string)}
          copied={copiedPrompt === "B"}
        />
      )}

      {draftingPrompts.promptC && (
        <PromptCard
          title="Prompt C - Compliance Visibility Snapshot"
          subtitle="Generated because Visibility Archive flag is active."
          prompt={draftingPrompts.promptC}
          onCopy={() => handleCopy("C", draftingPrompts.promptC as string)}
          copied={copiedPrompt === "C"}
        />
      )}

      {!hasPromptB && !hasPromptC && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          Prompt B is available when the referral archetype is detected. Prompt C is
          available when the Visibility Archive flag is active.
        </div>
      )}
    </section>
  )
}
