/**
 * Treatment Qualification Validator
 *
 * Detects unqualified treatment advice that makes absolute claims.
 * Healthcare marketing must qualify treatment outcomes (use "may" not "will").
 */

import { UNQUALIFIED_LANGUAGE } from '../policies/treatment-qualification'
import type { Violation } from '../types'

/**
 * Validate content for unqualified treatment advice.
 *
 * Flags absolute claims about treatment outcomes.
 * Example: "will cure" should be "may help manage".
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateTreatmentQualification(content: string): Promise<Violation[]> {
  const violations: Violation[] = []

  for (const phrase of UNQUALIFIED_LANGUAGE) {
    const regex = new RegExp(phrase.term, 'gi')
    let match

    while ((match = regex.exec(content)) !== null) {
      violations.push({
        policyId: 'treatment-qualification',
        severity: 'high',
        text: content.substring(
          Math.max(0, match.index - 20),
          Math.min(content.length, match.index + match[0].length + 20)
        ),
        explanation: `"${match[0]}" is unqualified treatment advice. Use "${phrase.qualified}" instead.`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return violations
}
