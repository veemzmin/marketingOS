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
 * Context-aware: excludes proper clinical usage (e.g., "mental health" is OK, "he's mental" is not).
 * Returns all violations with context snippets for user feedback.
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateStigmaLanguage(content: string): Promise<Violation[]> {
  const violations: Violation[] = []

  // Valid clinical contexts where certain terms are acceptable
  const validContexts: Record<string, RegExp[]> = {
    mental: [
      /\bmental health\b/i,
      /\bmental illness\b/i,
      /\bmental disorder\b/i,
      /\bmental wellness\b/i,
      /\bmental healthcare\b/i,
    ],
  }

  for (const term of STIGMA_TERMS) {
    // Use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    let match

    while ((match = regex.exec(content)) !== null) {
      // Check if this term has valid contexts to exclude
      const contexts = validContexts[term.toLowerCase()]
      if (contexts) {
        // Check if the match is within a valid context
        const surroundingText = content.substring(
          Math.max(0, match.index - 50),
          Math.min(content.length, match.index + match[0].length + 50)
        )
        const isValidContext = contexts.some(contextRegex => contextRegex.test(surroundingText))
        if (isValidContext) {
          continue // Skip this match - it's valid clinical usage
        }
      }

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
