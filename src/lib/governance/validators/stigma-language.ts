/**
 * Stigma Language Validator
 *
 * Detects stigmatizing mental health language using word-boundary regex.
 * Checks content against curated list of 50-100 stigmatizing terms.
 */

import { STIGMA_TERMS } from '../policies/stigma-language'
import type { Violation } from '../types'

/**
 * Validate content for stigmatizing language.
 *
 * Uses word-boundary regex to avoid partial matches (e.g., "addiction" shouldn't match "addict").
 * Returns all violations with context snippets for user feedback.
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateStigmaLanguage(content: string): Promise<Violation[]> {
  const violations: Violation[] = []

  for (const term of STIGMA_TERMS) {
    // Use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    let match

    while ((match = regex.exec(content)) !== null) {
      violations.push({
        policyId: 'stigma-language',
        severity: 'medium',
        text: content.substring(
          Math.max(0, match.index - 20),
          Math.min(content.length, match.index + match[0].length + 20)
        ),
        explanation: `"${match[0]}" is stigmatizing language. Use person-first or strengths-based language instead.`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return violations
}
