/**
 * Compliance Score Calculator
 *
 * Calculates 0-100 compliance scores from policy violations with weighted penalties.
 * Provides clear reasoning for score calculations to enable audit trails.
 */

import type { Violation, ComplianceScore } from '../types'
import { POLICY_WEIGHTS, PolicyId } from './weights'

/**
 * Calculate compliance score from violations.
 *
 * Algorithm:
 * 1. Start with perfect score (100)
 * 2. Group violations by policy ID
 * 3. Apply weighted penalty for each policy:
 *    - Additive policies: penalty * count (capped by maxPenalty)
 *    - Single policies: single penalty regardless of count
 * 4. Subtract total penalties from 100
 * 5. Clamp result to [0, 100]
 *
 * @param violations - Array of policy violations
 * @returns Compliance score with reasoning breakdown
 */
export function calculateComplianceScore(violations: Violation[]): ComplianceScore {
  if (violations.length === 0) {
    // Perfect score - all policies passed
    return {
      score: 100,
      reasoning: ['No policy violations found'],
      passed: Object.keys(POLICY_WEIGHTS),
      violations: [],
    }
  }

  let totalPenalty = 0
  const reasoning: string[] = []
  const passed: string[] = []

  // Group violations by policy ID
  const byPolicy = new Map<string, Violation[]>()
  violations.forEach(v => {
    if (!byPolicy.has(v.policyId)) byPolicy.set(v.policyId, [])
    byPolicy.get(v.policyId)!.push(v)
  })

  // Calculate penalties for each violated policy
  byPolicy.forEach((violationSet, policyId) => {
    const weight = POLICY_WEIGHTS[policyId as PolicyId]
    if (!weight) {
      console.warn(`Unknown policy ID: ${policyId}`)
      return
    }

    const count = violationSet.length
    let penalty = 0

    if (weight.mode === 'additive') {
      penalty = Math.min(count * weight.penalty, weight.maxPenalty)
      const plural = count > 1 ? 's' : ''
      reasoning.push(`${weight.description} (${count} item${plural}): -${penalty} points`)
    } else {
      penalty = weight.penalty
      reasoning.push(`${weight.description}: -${penalty} points`)
    }

    totalPenalty += penalty
  })

  // Identify policies that passed (not in violation map)
  Object.keys(POLICY_WEIGHTS).forEach(policyId => {
    if (!byPolicy.has(policyId)) {
      passed.push(policyId)
    }
  })

  // Score = 100 - totalPenalty, clamped to [0, 100]
  const score = Math.max(0, Math.min(100, 100 - totalPenalty))

  return {
    score: Math.round(score),
    reasoning,
    passed,
    violations,
  }
}
