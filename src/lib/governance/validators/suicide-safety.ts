/**
 * Suicide Safety Validator
 *
 * Requires crisis resources when content discusses suicide or self-harm.
 * CRITICAL SAFETY POLICY - highest penalty in compliance scoring.
 */

import { SUICIDE_KEYWORDS, hasRequiredCrisisResources } from '../policies/suicide-safety'
import type { Violation } from '../types'

/**
 * Validate content for suicide safety requirements.
 *
 * If content mentions suicide/self-harm, it MUST include crisis resources.
 * This is a whole-content validation (not position-specific).
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateSuicideSafety(content: string): Promise<Violation[]> {
  const violations: Violation[] = []
  const lowerContent = content.toLowerCase()

  // Check if content discusses suicide
  const discussesSuicide = SUICIDE_KEYWORDS.some(keyword => lowerContent.includes(keyword))

  if (discussesSuicide) {
    // If discussing suicide, MUST include crisis resources
    if (!hasRequiredCrisisResources(content)) {
      violations.push({
        policyId: 'suicide-safety',
        severity: 'high',
        text: 'Content discusses suicide without crisis resources',
        explanation: `Content mentions suicide but does not include required crisis resources (988 Lifeline or Crisis Text Line). Add: "If you're in crisis, call 988 or text HOME to 741741."`,
        startIndex: 0,
        endIndex: 0, // Whole-content violation
      })
    }
  }

  return violations
}
