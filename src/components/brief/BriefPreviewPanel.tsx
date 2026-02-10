import type { CampaignBrief } from "@/lib/brief/types"
import { BriefFieldBlock } from "@/components/brief/BriefFieldBlock"

type BriefPreviewPanelProps = {
  brief: CampaignBrief
  lockedFields: Set<string>
  onToggleLock: (fieldKey: string) => void
}

function WarningIcon() {
  return (
    <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14a1 1 0 00.88-1.48l-7.07-12.24a1 1 0 00-1.76 0L4.05 17.52A1 1 0 004.93 19z" />
    </svg>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-200">
      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${value * 10}%` }} />
    </div>
  )
}

export function BriefPreviewPanel({
  brief,
  lockedFields,
  onToggleLock,
}: BriefPreviewPanelProps) {
  const isLocked = (key: string) => lockedFields.has(key)

  return (
    <div className="space-y-6 text-sm text-gray-700">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Live Campaign Brief</h2>
        <p className="text-xs text-gray-500">Lock fields you want to preserve.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Program Overview
        </h3>
        <BriefFieldBlock
          fieldKey="title"
          label="Title"
          isLocked={isLocked("title")}
          onToggleLock={() => onToggleLock("title")}
        >
          {brief.title}
        </BriefFieldBlock>
        <BriefFieldBlock
          fieldKey="programSummary"
          label="Program Summary"
          isLocked={isLocked("programSummary")}
          onToggleLock={() => onToggleLock("programSummary")}
        >
          {brief.programSummary}
        </BriefFieldBlock>

        {brief.meta.audienceWarning && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <WarningIcon />
            <span>{brief.meta.audienceWarning}</span>
          </div>
        )}

        <BriefFieldBlock
          fieldKey="primaryAudience"
          label="Primary Audience"
          isLocked={isLocked("primaryAudience")}
          onToggleLock={() => onToggleLock("primaryAudience")}
        >
          {brief.primaryAudience}
        </BriefFieldBlock>
        {brief.missingInfoQuestions && brief.missingInfoQuestions.length > 0 && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
            <div className="font-semibold">Missing information needed before publishing:</div>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              {brief.missingInfoQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        )}

        <BriefFieldBlock
          fieldKey="secondaryAudience"
          label="Secondary Audience"
          isLocked={isLocked("secondaryAudience")}
          onToggleLock={() => onToggleLock("secondaryAudience")}
        >
          {brief.secondaryAudience ?? "Not applicable"}
        </BriefFieldBlock>
        <BriefFieldBlock
          fieldKey="positioningStatement"
          label="Positioning Statement"
          isLocked={isLocked("positioningStatement")}
          onToggleLock={() => onToggleLock("positioningStatement")}
        >
          {brief.positioningStatement}
        </BriefFieldBlock>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Messaging
        </h3>
        <BriefFieldBlock
          fieldKey="messagingPillars"
          label="Messaging Pillars"
          isLocked={isLocked("messagingPillars")}
          onToggleLock={() => onToggleLock("messagingPillars")}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {brief.messagingPillars.map((pillar) => (
              <div key={pillar.pillar} className="rounded-md border border-gray-200 p-3">
                <div className="font-semibold text-gray-900">{pillar.pillar}</div>
                <div className="mt-2 text-xs text-gray-500">Do</div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-gray-700">
                  {pillar.do.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-gray-500">Avoid</div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-gray-700">
                  {pillar.avoid.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </BriefFieldBlock>

        <BriefFieldBlock
          fieldKey="toneProfile"
          label="Tone Profile"
          isLocked={isLocked("toneProfile")}
          onToggleLock={() => onToggleLock("toneProfile")}
        >
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Calm</span>
                <span>{brief.toneProfile.calm}/10</span>
              </div>
              <ProgressBar value={brief.toneProfile.calm} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Upbeat</span>
                <span>{brief.toneProfile.upbeat}/10</span>
              </div>
              <ProgressBar value={brief.toneProfile.upbeat} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Formal</span>
                <span>{brief.toneProfile.formal}/10</span>
              </div>
              <ProgressBar value={brief.toneProfile.formal} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {brief.toneProfile.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </BriefFieldBlock>

        <BriefFieldBlock
          fieldKey="contentThemes"
          label="Content Themes"
          isLocked={isLocked("contentThemes")}
          onToggleLock={() => onToggleLock("contentThemes")}
        >
          <ol className="list-decimal space-y-1 pl-4">
            {brief.contentThemes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ol>
        </BriefFieldBlock>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Channels and Cadence
        </h3>
        <BriefFieldBlock
          fieldKey="channelPlan"
          label="Channel Plan"
          isLocked={isLocked("channelPlan")}
          onToggleLock={() => onToggleLock("channelPlan")}
        >
          <div className="flex flex-wrap gap-2">
            {brief.channelPlan.map((channel) => (
              <span
                key={channel}
                className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
              >
                {channel}
              </span>
            ))}
          </div>
        </BriefFieldBlock>
        <BriefFieldBlock
          fieldKey="cadencePlan"
          label="Cadence Plan"
          isLocked={isLocked("cadencePlan")}
          onToggleLock={() => onToggleLock("cadencePlan")}
        >
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900">
              {brief.cadencePlan.frequency}
            </div>
            <p className="text-xs text-gray-600">{brief.cadencePlan.rationale}</p>
          </div>
        </BriefFieldBlock>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Execution
        </h3>
        <BriefFieldBlock
          fieldKey="experimentPlan"
          label="Experiment Plan"
          isLocked={isLocked("experimentPlan")}
          onToggleLock={() => onToggleLock("experimentPlan")}
        >
          <div className="space-y-3">
            {brief.experimentPlan.map((experiment) => (
              <div key={experiment.id} className="rounded-md border border-gray-200 p-3">
                <div className="text-sm font-semibold text-gray-900">{experiment.name}</div>
                <p className="text-xs text-gray-600">{experiment.hypothesis}</p>
                <div className="mt-1 text-xs text-gray-500">
                  Safety class: {experiment.safetyClass}
                </div>
              </div>
            ))}
          </div>
        </BriefFieldBlock>
        <BriefFieldBlock
          fieldKey="requiredAssets"
          label="Required Assets"
          isLocked={isLocked("requiredAssets")}
          onToggleLock={() => onToggleLock("requiredAssets")}
        >
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Asset Type</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {brief.requiredAssets.map((asset) => (
                  <tr key={asset.assetType} className="border-t border-gray-200">
                    <td className="px-3 py-2">{asset.assetType}</td>
                    <td className="px-3 py-2 text-gray-600">{asset.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BriefFieldBlock>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Compliance and Signals
        </h3>
        <BriefFieldBlock
          fieldKey="complianceNotes"
          label="Compliance Notes"
          isLocked={isLocked("complianceNotes")}
          onToggleLock={() => onToggleLock("complianceNotes")}
        >
          <div className="space-y-2 text-xs text-gray-700">
            <div>
              <span className="font-semibold">Requires Visibility Archive:</span>{" "}
              {brief.complianceNotes.requiresVisibilityArchive ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold">Requires Approval Workflow:</span>{" "}
              {brief.complianceNotes.requiresApprovalWorkflow ? "Yes" : "No"}
            </div>
            <div>
              <div className="font-semibold">Claims Cautions</div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {brief.complianceNotes.claimsCautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </BriefFieldBlock>

        <BriefFieldBlock
          fieldKey="successSignals"
          label="Success Signals"
          isLocked={isLocked("successSignals")}
          onToggleLock={() => onToggleLock("successSignals")}
        >
          <ul className="list-disc space-y-1 pl-4">
            {brief.successSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </BriefFieldBlock>

        <BriefFieldBlock
          fieldKey="constraints"
          label="Constraints"
          isLocked={isLocked("constraints")}
          onToggleLock={() => onToggleLock("constraints")}
        >
          <ul className="space-y-2">
            {brief.constraints.map((constraint) => (
              <li key={constraint} className="flex items-start gap-2">
                <WarningIcon />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </BriefFieldBlock>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Metadata
        </h3>
        <BriefFieldBlock
          fieldKey="meta"
          label="Brief Metadata"
          isLocked={isLocked("meta")}
          onToggleLock={() => onToggleLock("meta")}
        >
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-semibold">Generated:</span> {brief.meta.generatedAt}
            </div>
            <div>
              <span className="font-semibold">Brief Version:</span>{" "}
              {brief.meta.brief_version}
            </div>
            <div>
              <span className="font-semibold">Engine Version:</span>{" "}
              {brief.meta.engine_version}
            </div>
          </div>
        </BriefFieldBlock>
      </section>
    </div>
  )
}
