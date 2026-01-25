/**
 * DSM-5 Terminology Validator
 *
 * Validates diagnostic terminology against DSM-5 reference list.
 * Uses inverse validation: flags diagnostic terms NOT in the approved list.
 */

import { DSM5_TERMS } from '../policies/dsm5-terminology'
import type { Violation } from '../types'

/**
 * Validate content for DSM-5 terminology usage.
 *
 * Looks for diagnostic patterns and checks against approved DSM-5 terms.
 * Flags potential non-standard diagnostic language for review.
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateDSM5Terminology(content: string): Promise<Violation[]> {
  const violations: Violation[] = []

  // Look for diagnostic terms NOT in DSM5_TERMS list
  // Pattern: "diagnosed with X" or "has X disorder/condition"
  const diagnosisPattern = /(?:diagnosed with|has|suffering from|living with)\s+([a-z\s]+(?:disorder|condition|syndrome))/gi
  let match

  while ((match = diagnosisPattern.exec(content)) !== null) {
    const term = match[1].trim().toLowerCase()
    const isValid = DSM5_TERMS.some(dsm5Term => term.includes(dsm5Term.toLowerCase()))

    if (!isValid) {
      violations.push({
        policyId: 'dsm5-terminology',
        severity: 'medium',
        text: match[0],
        explanation: `"${term}" may not be valid DSM-5 terminology. Verify against DSM-5-TR or use general language.`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return violations
}
