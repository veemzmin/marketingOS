/**
 * Composite Validator
 *
 * Orchestrates all 6 policy validators executing in parallel.
 * Provides single entry point for content validation.
 */

import { validateMedicalClaims } from './medical-claims'
import { validateStigmaLanguage } from './stigma-language'
import { validateDSM5Terminology } from './dsm5-terminology'
import { validateTreatmentQualification } from './treatment-qualification'
import { validateSuicideSafety } from './suicide-safety'
import { validateConsentRequirement } from './consent-requirements'

export type { Violation } from '../types'

/**
 * Validate content against all governance policies.
 *
 * Runs all 6 validators in parallel for performance.
 * Returns combined violations sorted by position in content.
 *
 * @param content - Text content to validate
 * @returns Array of all violations found across all policies
 */
export async function validateContent(content: string) {
  // Run all validators in parallel
  const [
    medicalViolations,
    stigmaViolations,
    dsm5Violations,
    qualificationViolations,
    suicideViolations,
    consentViolations,
  ] = await Promise.all([
    validateMedicalClaims(content),
    validateStigmaLanguage(content),
    validateDSM5Terminology(content),
    validateTreatmentQualification(content),
    validateSuicideSafety(content),
    validateConsentRequirement(content),
  ])

  // Combine and sort by position in content
  return [
    ...medicalViolations,
    ...stigmaViolations,
    ...dsm5Violations,
    ...qualificationViolations,
    ...suicideViolations,
    ...consentViolations,
  ].sort((a, b) => a.startIndex - b.startIndex)
}
