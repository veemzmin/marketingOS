/**
 * Consent Requirements Policy
 *
 * Requires documented consent for patient testimonials and success stories.
 * HIPAA compliance requirement for using patient information in marketing.
 *
 * References:
 * - HIPAA Privacy Rule (45 CFR § 164.508)
 * - CMS Marketing Guidance
 */

/**
 * Indicators that content includes a patient testimonial or success story.
 */
export const TESTIMONIAL_INDICATORS = [
  'patient story',
  'patient testimonial',
  'client testimonial',
  'success story',
  'patient experience',
  'real story',
  'client story',
  'client experience',
  'treatment journey',
  'recovery story',
  'personal story',
  'case study',
  'patient case',
] as const

/**
 * Required consent language patterns that must be present with testimonials.
 */
export const CONSENT_PATTERNS = [
  'written consent',
  'with consent',
  'consent obtained',
  'authorized',
  'permission obtained',
  'consent on file',
  'approved for sharing',
  'shared with permission',
  'HIPAA authorization',
  'authorized disclosure',
] as const

/**
 * Type-safe testimonial indicator.
 */
export type TestimonialIndicator = typeof TESTIMONIAL_INDICATORS[number]

/**
 * Type-safe consent pattern.
 */
export type ConsentPattern = typeof CONSENT_PATTERNS[number]
