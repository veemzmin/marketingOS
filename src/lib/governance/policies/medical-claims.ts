/**
 * Medical Claims Policy
 *
 * Defines unsupported medical claims that should be avoided in healthcare marketing.
 * Based on FTC Health Claims guidance and FDA advertising regulations.
 *
 * References:
 * - FTC Health Claims: Advertising FAQ
 * - FDA: Internet/Social Media Platforms Guidance
 */

/**
 * Unsupported medical claim patterns with context and alternatives.
 */
export const UNSUPPORTED_CLAIMS = [
  {
    term: 'cure',
    context: 'mental health',
    alternative: 'effective treatment for',
    explanation: 'No mental health condition can be "cured" - use "manage" or "treat" instead',
  },
  {
    term: 'cures',
    context: 'mental health',
    alternative: 'helps manage',
    explanation: 'No mental health condition can be "cured" - use "manage" or "treat" instead',
  },
  {
    term: 'guaranteed',
    context: 'treatment outcome',
    alternative: 'may help',
    explanation: 'Treatment outcomes cannot be guaranteed - results vary by individual',
  },
  {
    term: 'guarantee',
    context: 'treatment outcome',
    alternative: 'shown to help',
    explanation: 'Treatment outcomes cannot be guaranteed - results vary by individual',
  },
  {
    term: 'proven to eliminate',
    context: 'symptoms',
    alternative: 'shown to reduce',
    explanation: 'Symptoms can be reduced but rarely fully eliminated',
  },
  {
    term: 'eliminates',
    context: 'symptoms',
    alternative: 'reduces',
    explanation: 'Symptoms can be reduced but rarely fully eliminated',
  },
  {
    term: 'fixes',
    context: 'mental health',
    alternative: 'supports improvement in',
    explanation: 'Mental health is not "fixed" - use person-first language',
  },
  {
    term: 'permanent solution',
    context: 'mental health',
    alternative: 'long-term management strategy',
    explanation: 'Mental health requires ongoing management, not permanent solutions',
  },
  {
    term: 'instant relief',
    context: 'mental health',
    alternative: 'may provide relief over time',
    explanation: 'Mental health treatment takes time - avoid implying instant results',
  },
  {
    term: 'completely reverse',
    context: 'mental health',
    alternative: 'improve',
    explanation: 'Mental health conditions cannot be "reversed"',
  },
  {
    term: '100% effective',
    context: 'treatment',
    alternative: 'highly effective for many people',
    explanation: 'No treatment is 100% effective for everyone',
  },
  {
    term: 'works for everyone',
    context: 'treatment',
    alternative: 'works for many people',
    explanation: 'Individual responses to treatment vary',
  },
  {
    term: 'scientifically proven to cure',
    context: 'mental health',
    alternative: 'clinically shown to help manage',
    explanation: 'Even with clinical evidence, "cure" is not appropriate for mental health',
  },
] as const

/**
 * Type-safe medical claim pattern.
 */
export type MedicalClaimPattern = typeof UNSUPPORTED_CLAIMS[number]
