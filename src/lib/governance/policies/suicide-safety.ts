/**
 * Suicide Safety Policy
 *
 * Requires crisis resources when content discusses suicide or self-harm.
 * Critical safety policy - highest penalty in compliance scoring.
 *
 * References:
 * - 988 Suicide and Crisis Lifeline (https://988lifeline.org/)
 * - Crisis Text Line (https://www.crisistextline.org/)
 * - SAMHSA Guidelines for Messaging About Suicide
 */

/**
 * Required crisis resources that must be included when discussing suicide.
 */
export const REQUIRED_RESOURCES = [
  {
    name: '988 Suicide and Crisis Lifeline',
    phone: '988',
    text: 'Text 988',
    website: 'https://988lifeline.org/',
    description: 'Free, 24/7 crisis support in English and Spanish',
  },
  {
    name: 'Crisis Text Line',
    phone: null,
    text: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org/',
    description: 'Free, 24/7 text-based crisis support',
  },
  {
    name: 'Veterans Crisis Line',
    phone: '988 then press 1',
    text: 'Text 838255',
    website: 'https://www.veteranscrisisline.net/',
    description: 'Specialized support for veterans and their families',
  },
] as const

/**
 * Keywords that indicate suicide discussion (triggers resource requirement).
 */
export const SUICIDE_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'kill themselves',
  'end my life',
  'end their life',
  'take my life',
  'take their life',
  'self-harm',
  'self harm',
  'hurt myself',
  'hurt themselves',
  'die by suicide',
  'suicidal thoughts',
  'suicidal ideation',
  'suicide attempt',
  'suicide plan',
  'suicide prevention',
  'crisis hotline',
  'crisis line',
] as const

/**
 * Check if content includes required crisis resources.
 *
 * @param content - Text content to check
 * @returns true if required crisis resources are present
 */
export function hasRequiredCrisisResources(content: string): boolean {
  const lowerContent = content.toLowerCase()

  // Check for 988 Lifeline (primary resource)
  const has988 =
    lowerContent.includes('988') &&
    (lowerContent.includes('lifeline') ||
      lowerContent.includes('crisis') ||
      lowerContent.includes('suicide'))

  // Check for Crisis Text Line
  const hasCrisisText =
    lowerContent.includes('741741') ||
    (lowerContent.includes('crisis text line') && lowerContent.includes('home'))

  // Content passes if it includes at least one primary resource
  return has988 || hasCrisisText
}

/**
 * Type-safe suicide keyword.
 */
export type SuicideKeyword = typeof SUICIDE_KEYWORDS[number]

/**
 * Type-safe crisis resource.
 */
export type CrisisResource = typeof REQUIRED_RESOURCES[number]
