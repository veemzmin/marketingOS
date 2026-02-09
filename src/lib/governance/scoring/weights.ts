/**
 * Policy Penalty Weights
 *
 * Defines weighted penalties for each policy type in compliance scoring.
 * Weights are based on healthcare risk assessment and regulatory requirements.
 *
 * Scoring Formula: Score = 100 - sum(penalties)
 *
 * Rationale:
 * - Medical claims (25pts): Unsupported treatment claims are high-risk (potential harm, regulatory issues)
 * - Suicide safety (30pts): HIGHEST penalty - failing to provide crisis resources is dangerous
 * - Treatment qualification (20pts): Unqualified advice ("cures") misleads patients
 * - DSM-5 (15pts): Incorrect terminology undermines clinical credibility
 * - Consent (10pts): Legal/HIPAA requirement but lower immediate risk than medical claims
 * - Stigma (5pts/term, max 30pts): Important for brand but lower medical risk than claims
 */

export const POLICY_WEIGHTS = {
  'medical-claims': {
    penalty: 25,
    description: 'Unsupported medical claim',
    maxPenalty: 25, // Single violation counts once
    mode: 'single',
  },
  'suicide-safety': {
    penalty: 30,
    description: 'Suicide discussion without crisis resources',
    maxPenalty: 30, // Highest penalty - safety critical
    mode: 'single',
  },
  'treatment-qualification': {
    penalty: 20,
    description: 'Unqualified treatment advice',
    maxPenalty: 20,
    mode: 'single',
  },
  'dsm5-terminology': {
    penalty: 15,
    description: 'Invalid DSM-5 terminology',
    maxPenalty: 15,
    mode: 'single',
  },
  'consent': {
    penalty: 10,
    description: 'Missing patient testimonial consent',
    maxPenalty: 10,
    mode: 'single',
  },
  'stigma-language': {
    penalty: 5,
    description: 'Stigmatizing language',
    maxPenalty: 30, // Each term = -5 points, cap at 6 terms (30 points)
    mode: 'additive',
  },
  'custom-patterns': {
    penalty: 8,
    description: 'Custom forbidden pattern',
    maxPenalty: 32,
    mode: 'additive',
  },
  'required-phrases': {
    penalty: 10,
    description: 'Missing required framing',
    maxPenalty: 30,
    mode: 'additive',
  },
} as const

/**
 * Type-safe policy ID.
 */
export type PolicyId = keyof typeof POLICY_WEIGHTS
