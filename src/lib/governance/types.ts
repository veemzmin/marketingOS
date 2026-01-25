/**
 * Governance Engine Type Definitions
 *
 * Core types for policy validation, compliance scoring, and violation tracking.
 * These types are shared across validators, scoring engine, and API routes.
 */

/**
 * Severity levels for internal violation ranking (not shown to user in MVP)
 */
export type PolicySeverity = 'high' | 'medium' | 'low'

/** @deprecated Use PolicySeverity instead */
export type ViolationSeverity = PolicySeverity

/**
 * A single policy violation detected in content
 */
export interface Violation {
  /** Policy identifier (e.g., 'medical-claims', 'stigma-language') */
  policyId: string

  /** Severity level for internal ranking */
  severity: PolicySeverity

  /** Problematic text snippet from content (with context) */
  text: string

  /** Clear explanation of why this violates policy */
  explanation: string

  /** Start position of violation in content (for UI highlighting in Phase 3) */
  startIndex: number

  /** End position of violation in content */
  endIndex: number
}

/**
 * Result of running validation on content
 *
 * Uses discriminated union pattern to enable type narrowing:
 * - if (result.status === 'pass') { ... }
 * - if (result.status === 'violations') { result.violations is accessible }
 */
export type ValidationResult =
  | { status: 'pass' }
  | { status: 'violations'; violations: Violation[] }

/**
 * Compliance score result with reasoning breakdown
 */
export interface ComplianceScore {
  /** Numeric score 0-100 (100 = perfect compliance, 0 = multiple critical violations) */
  score: number

  /** Human-readable breakdown of how score was calculated */
  reasoning: string[]

  /** Policy IDs that passed validation */
  passed: string[]

  /** All violations detected */
  violations: Violation[]
}
