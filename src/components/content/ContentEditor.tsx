'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contentFormSchema, type ContentFormData } from '@/lib/validators/content-schema'
import { GovernanceFeedback } from './GovernanceFeedback'
import { SaveStatus } from './SaveStatus'
import { saveDraftAction, validateGovernanceAction } from '@/lib/actions/content'
import { submitForReview } from '@/lib/actions/review'
import { createCampaignGenerationJob } from '@/lib/actions/generation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Violation } from '@/lib/governance/types'
import toast from 'react-hot-toast'
import type { CampaignTemplate } from '@/lib/campaign/engine'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ContentEditorProps {
  initialContent?: {
    id: string
    title: string
    versions: Array<{
      body: string
      topic: string
      audience: string
      tone: string
    }>
  }
}

export function ContentEditor({ initialContent }: ContentEditorProps) {
  const router = useRouter()
  const latestVersion = initialContent?.versions?.[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: initialContent?.title || '',
      body: latestVersion?.body || '',
      topic: (latestVersion?.topic as ContentFormData['topic']) || 'mental-health',
      audience: (latestVersion?.audience as ContentFormData['audience']) || 'general',
      tone: (latestVersion?.tone as ContentFormData['tone']) || 'informative',
    },
  })

  const [violations, setViolations] = useState<Violation[]>([])
  const [validationLoading, setValidationLoading] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [contentId, setContentId] = useState<string | undefined>(initialContent?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complianceScore, setComplianceScore] = useState<number | null>(null)
  const [campaignIdInput, setCampaignIdInput] = useState('')
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Watch individual form fields
  const title = watch('title')
  const bodyText = watch('body')
  const topic = watch('topic')
  const audience = watch('audience')
  const tone = watch('tone')

  useEffect(() => {
    if (!campaignIdInput) {
      setTemplates([])
      setSelectedTemplateId('')
      return
    }

    setTemplatesLoading(true)
    fetch(`/api/campaigns/${campaignIdInput}/templates`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.templates)) {
          setTemplates(data.templates)
          if (data.templates.length > 0) {
            setSelectedTemplateId(data.templates[0].id)
          }
        } else {
          setTemplates([])
        }
      })
      .catch(() => {
        setTemplates([])
      })
      .finally(() => {
        setTemplatesLoading(false)
      })
  }, [campaignIdInput])

  // Debounced governance validation (300ms)
  useEffect(() => {
    if (!bodyText || bodyText.length < 50) {
      setViolations([])
      return
    }

    setValidationLoading(true)
    const timer = setTimeout(async () => {
      const result = await validateGovernanceAction(bodyText)
      setViolations(result.violations)
      setComplianceScore(result.complianceScore)
      setValidationLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [bodyText])

  // Debounced auto-save (1000ms)
  useEffect(() => {
    // Skip if form is invalid
    if (!title || !bodyText || title.length < 5) {
      return
    }

    setSaveState('saving')
    const timer = setTimeout(async () => {
      const result = await saveDraftAction({
        contentId,
        formData: { title: title, body: bodyText, topic, audience, tone },
      })

      if (result.success) {
        if (result.contentId && !contentId) {
          setContentId(result.contentId)
        }
        setSaveState('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveState('idle'), 2000)
      } else {
        setSaveState('error')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, bodyText, topic, audience, tone, contentId])

  const onSubmit = async (_data: ContentFormData) => {
    if (!contentId) {
      alert('Content must be saved before submitting')
      return
    }

    if (violations.length > 0) {
      alert('Cannot submit content with policy violations')
      return
    }

    if (complianceScore === null || complianceScore < 70) {
      alert('Content must have a compliance score of at least 70 to submit for review')
      return
    }

    setIsSubmitting(true)
    const result = await submitForReview(contentId)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Content submitted for review successfully!')
      // Small delay to allow toast to be visible
      setTimeout(() => {
        router.push('/dashboard/content/list')
      }, 1500)
    } else {
      toast.error(result.error || 'Failed to submit content')
    }
  }

  const handleApplyTemplate = () => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      toast.error('Select a template first')
      return
    }
    if (template.titleTemplate) {
      setValue('title', template.titleTemplate)
    }
    if (template.bodyTemplate) {
      setValue('body', template.bodyTemplate)
    }
  }

  const handleGenerateDraft = async () => {
    if (!campaignIdInput || !selectedTemplateId) {
      toast.error('Campaign ID and template are required')
      return
    }

    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      toast.error('Template not found')
      return
    }

    setIsGenerating(true)
    const result = await createCampaignGenerationJob({
      campaignId: campaignIdInput,
      templateId: selectedTemplateId,
      contentId,
      context: {
        topic,
        audience,
        tone,
        contentType: template.contentType,
        platform: template.platform,
      },
    })
    setIsGenerating(false)

    if (result.success) {
      toast.success(`Generation job started: ${result.data.jobId}`)
    } else {
      toast.error(result.error || 'Failed to start generation job')
    }
  }

  const charCount = bodyText?.length || 0
  const maxChars = 50000

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Save Status */}
      <div className="flex justify-end">
        <SaveStatus state={saveState} />
      </div>

      {/* Campaign + Templates */}
      <div className="rounded border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Context</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="campaignId" className="block text-sm font-medium mb-2">
              Campaign ID (optional)
            </label>
            <input
              id="campaignId"
              type="text"
              value={campaignIdInput}
              onChange={(e) => setCampaignIdInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="campaignId"
            />
          </div>
          <div>
            <label htmlFor="templateId" className="block text-sm font-medium mb-2">
              Template
            </label>
            <select
              id="templateId"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              disabled={!campaignIdInput || templatesLoading}
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {templatesLoading && (
              <p className="text-xs text-gray-500 mt-1">Loading templates...</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyTemplate}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={!selectedTemplateId}
          >
            Apply Template
          </button>
          <button
            type="button"
            onClick={handleGenerateDraft}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!campaignIdInput || !selectedTemplateId || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Draft'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter content title"
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-2">
          Content
        </label>
        <textarea
          id="body"
          {...register('body')}
          rows={15}
          className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
          placeholder="Enter your content here..."
        />
        <div className="flex justify-between items-center mt-1">
          {errors.body ? (
            <p className="text-red-600 text-sm">{errors.body.message}</p>
          ) : (
            <span className="text-gray-500 text-sm">
              {charCount} / {maxChars} characters
            </span>
          )}
        </div>
      </div>

      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-sm font-medium mb-2">
          Topic
        </label>
        <select
          id="topic"
          {...register('topic')}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="mental-health">Mental Health</option>
          <option value="substance-use">Substance Use</option>
          <option value="wellness">Wellness</option>
          <option value="crisis">Crisis</option>
        </select>
        {errors.topic && (
          <p className="text-red-600 text-sm mt-1">{errors.topic.message}</p>
        )}
      </div>

      {/* Audience */}
      <div>
        <label htmlFor="audience" className="block text-sm font-medium mb-2">
          Audience
        </label>
        <select
          id="audience"
          {...register('audience')}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="patients">Patients</option>
          <option value="families">Families</option>
          <option value="professionals">Professionals</option>
          <option value="general">General</option>
        </select>
        {errors.audience && (
          <p className="text-red-600 text-sm mt-1">{errors.audience.message}</p>
        )}
      </div>

      {/* Tone */}
      <div>
        <label htmlFor="tone" className="block text-sm font-medium mb-2">
          Tone
        </label>
        <select
          id="tone"
          {...register('tone')}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="informative">Informative</option>
          <option value="supportive">Supportive</option>
          <option value="clinical">Clinical</option>
          <option value="motivational">Motivational</option>
        </select>
        {errors.tone && (
          <p className="text-red-600 text-sm mt-1">{errors.tone.message}</p>
        )}
      </div>

      {/* Platform Preview */}
      <div className="rounded border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Preview</h3>
        <Tabs defaultValue="instagram">
          <TabsList>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>
          {['instagram', 'facebook', 'linkedin', 'twitter', 'blog'].map((platform) => (
            <TabsContent key={platform} value={platform} className="mt-4">
              <div className="rounded border border-gray-100 bg-gray-50 p-4 text-sm whitespace-pre-wrap">
                {bodyText || 'Start typing to see a preview...'}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Governance Feedback */}
      {bodyText && bodyText.length >= 50 && (
        <GovernanceFeedback violations={violations} loading={validationLoading} complianceScore={complianceScore} />
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={violations.length > 0 || isSubmitting || (complianceScore !== null && complianceScore < 70)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
        {complianceScore !== null && complianceScore < 70 && (
          <p className="text-sm text-red-600 self-center">
            Compliance score must be at least 70 to submit for review
          </p>
        )}
      </div>
    </form>
  )
}
