/**
 * Consent Requirements Validator
 *
 * Requires documented consent for patient testimonials and success stories.
 * HIPAA compliance requirement for using patient information in marketing.
 */

import { TESTIMONIAL_INDICATORS, CONSENT_PATTERNS } from '../policies/consent-requirements'
import type { Violation } from '../types'

/**
 * Validate content for patient testimonial consent requirements.
 *
 * If content includes patient story/testimonial, it MUST mention consent.
 * This is a whole-content validation (not position-specific).
 *
 * @param content - Text content to validate
 * @returns Array of violations (empty if none found)
 */
export async function validateConsentRequirement(content: string): Promise<Violation[]> {
  const violations: Violation[] = []
  const lowerContent = content.toLowerCase()

  // Check if content includes patient testimonial
  const hasTestimonial = TESTIMONIAL_INDICATORS.some(indicator => lowerContent.includes(indicator))

  if (hasTestimonial) {
    // If testimonial present, MUST mention consent
    const hasConsent = CONSENT_PATTERNS.some(pattern => lowerContent.includes(pattern))

    if (!hasConsent) {
      violations.push({
        policyId: 'consent',
        severity: 'medium',
        text: 'Patient testimonial without documented consent',
        explanation: `Content includes patient story/testimonial but does not mention consent. Add: "Shared with written consent" or similar HIPAA-compliant language.`,
        startIndex: 0,
        endIndex: 0, // Whole-content violation
      })
    }
  }

  return violations
}
