'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contentFormSchema, type ContentFormData } from '@/lib/validators/content-schema'
import { GovernanceFeedback } from './GovernanceFeedback'
import { SaveStatus } from './SaveStatus'
import { saveDraftAction, validateGovernanceAction, submitContentAction } from '@/lib/actions/content'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Violation } from '@/lib/governance/types'

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

  // Watch individual form fields
  const title = watch('title')
  const bodyText = watch('body')
  const topic = watch('topic')
  const audience = watch('audience')
  const tone = watch('tone')

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
      setValidationLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [bodyText])

  // Debounced auto-save (1000ms)
  useEffect(() => {
    // Skip if form is invalid
    if (!title || !bodyText || title.length < 5 || bodyText.length < 50) {
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

  const onSubmit = async (data: ContentFormData) => {
    if (!contentId) {
      alert('Content must be saved before submitting')
      return
    }

    if (violations.length > 0) {
      alert('Cannot submit content with policy violations')
      return
    }

    setIsSubmitting(true)
    const result = await submitContentAction({ contentId })
    setIsSubmitting(false)

    if (result.success) {
      router.push('/dashboard/content/list')
    } else {
      alert(result.error || 'Failed to submit content')
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

      {/* Governance Feedback */}
      {bodyText && bodyText.length >= 50 && (
        <GovernanceFeedback violations={violations} loading={validationLoading} />
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={violations.length > 0 || isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </form>
  )
}
