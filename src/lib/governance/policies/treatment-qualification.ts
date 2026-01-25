/**
 * Treatment Qualification Policy
 *
 * Defines unqualified treatment advice patterns that must be qualified.
 * Healthcare marketing must avoid absolute claims about treatment outcomes.
 *
 * References:
 * - FDA: Internet/Social Media Platforms Guidance
 * - FTC: Truth in Advertising
 */

/**
 * Unqualified language patterns with qualified alternatives.
 */
export const UNQUALIFIED_LANGUAGE = [
  {
    term: 'will cure',
    qualified: 'may help manage',
    explanation: 'Treatment outcomes vary - avoid absolute claims like "will cure"',
  },
  {
    term: 'will eliminate',
    qualified: 'may reduce',
    explanation: 'Symptoms can often be reduced but rarely completely eliminated',
  },
  {
    term: 'eliminates symptoms',
    qualified: 'can reduce symptoms',
    explanation: 'Use "can" or "may" instead of absolute "eliminates"',
  },
  {
    term: 'prevents relapse',
    qualified: 'may help prevent relapse',
    explanation: 'Relapse prevention is not guaranteed - use qualified language',
  },
  {
    term: 'completely resolves',
    qualified: 'can improve',
    explanation: 'Complete resolution is rare - use more realistic language',
  },
  {
    term: 'ensures recovery',
    qualified: 'supports recovery',
    explanation: 'Recovery cannot be ensured - use supportive language instead',
  },
  {
    term: 'guarantees improvement',
    qualified: 'often leads to improvement',
    explanation: 'Individual responses vary - avoid guarantees',
  },
  {
    term: 'always works',
    qualified: 'works for many people',
    explanation: 'No treatment works for everyone - be realistic about outcomes',
  },
  {
    term: 'never fails',
    qualified: 'has shown effectiveness',
    explanation: 'All treatments can fail for some individuals',
  },
  {
    term: 'permanent fix',
    qualified: 'long-term management tool',
    explanation: 'Mental health requires ongoing management, not permanent fixes',
  },
] as const

/**
 * Type-safe unqualified language pattern.
 */
export type UnqualifiedLanguagePattern = typeof UNQUALIFIED_LANGUAGE[number]
