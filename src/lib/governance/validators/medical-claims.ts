/**
 * Medical Claims Validator
 *
 * Detects unsupported medical claims with context awareness.
 * Flags claims like "cures depression" but allows "cure for common cold" (different context).
 */

import { UNSUPPORTED_CLAIMS } from '../policies/medical-claims'
import type { Violation } from '../types'

/**
 * Validate content for unsupported medical claims.
 *
 * Uses context-aware matching to detect claims within mental health context.
 * Example: "cure" is flagged near "depression" but not near "common cold".
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateMedicalClaims(content: string): Promise<Violation[]> {
  const violations: Violation[] = []

  for (const claim of UNSUPPORTED_CLAIMS) {
    // Context-aware: term near mental health keywords
    const contextRegex = new RegExp(
      `\\b${claim.term}\\b[^.]{0,50}\\b(mental|psychiatric|psychological|emotional|behavioral|depression|anxiety|ptsd|ocd|bipolar|schizophrenia|therapy|treatment|medication)`,
      'gi'
    )

    let match
    while ((match = contextRegex.exec(content)) !== null) {
      violations.push({
        policyId: 'medical-claims',
        severity: 'high',
        text: content.substring(
          Math.max(0, match.index - 30),
          Math.min(content.length, match.index + match[0].length + 30)
        ),
        explanation: `"${claim.term}" is not supported as a medical claim for ${claim.context}. Instead, use "${claim.alternative}".`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return violations
}
