/**
 * intake-engine.test.ts
 *
 * Safety guardrails (Item 7) + behavioral regression tests for Phase 6 fields.
 * These tests are deterministic - no randomness, no external deps.
 */
import {
  analyzeIntake,
  EXPERIMENT_LIBRARY,
} from "@/lib/strategy/intake-engine"

// Item 7: Safety Guardrails

const URGENCY_FORBIDDEN_STRINGS = [
  "call now",
  "book now",
  "book assessment",
  "act now",
  "limited spots",
  "don't wait",
  "dont wait",
  "schedule now",
]

const PATIENT_STORY_FORBIDDEN = ["patient story", "client story"]

describe("Safety guardrails - EXPERIMENT_LIBRARY (Item 7)", () => {
  EXPERIMENT_LIBRARY.forEach((exp) => {
    const variantTexts = [
      exp.variantA.toLowerCase(),
      exp.variantB.toLowerCase(),
      exp.name.toLowerCase(),
      exp.hypothesis.toLowerCase(),
    ]

    test(`${exp.id}: no urgency CTA strings in variants`, () => {
      for (const text of variantTexts) {
        for (const forbidden of URGENCY_FORBIDDEN_STRINGS) {
          expect(text).not.toContain(forbidden)
        }
      }
    })

    test(`${exp.id}: no patient/client story content by default`, () => {
      for (const text of variantTexts) {
        for (const forbidden of PATIENT_STORY_FORBIDDEN) {
          expect(text).not.toContain(forbidden)
        }
      }
    })
  })
})

// Item 5: stakeholdersClarityLevel

describe("stakeholdersClarityLevel (Item 5)", () => {
  test("returns 'low' when no audience terms and vague terms present", () => {
    const result = analyzeIntake({
      intakeText: "We want to reach everyone in the community for general awareness",
    })
    expect(result.stakeholdersClarityLevel).toBe("low")
  })

  test("returns 'low' when no audience terms at all", () => {
    const result = analyzeIntake({
      intakeText: "We are launching a new program for general awareness and outreach",
    })
    expect(result.stakeholdersClarityLevel).toBe("low")
  })

  test("returns 'medium' when exactly one specific audience term present", () => {
    const result = analyzeIntake({
      intakeText: "This campaign targets families of individuals seeking care",
    })
    expect(result.stakeholdersClarityLevel).toBe("medium")
  })

  test("returns 'high' when two or more specific audience terms present", () => {
    const result = analyzeIntake({
      intakeText: "Campaign for referring physicians and primary care providers",
    })
    expect(result.stakeholdersClarityLevel).toBe("high")
  })
})

// Item 1: confidenceScore

describe("confidenceScore (Item 1)", () => {
  test("is within 0-100 range for all inputs", () => {
    const inputs = [
      "general awareness",
      "We are launching a new IOP program. Email drip for referring physicians and providers.",
      "Compliance reporting for annual board report. State approval required.",
      "",
    ]
    for (const intakeText of inputs) {
      const result = analyzeIntake({ intakeText })
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(100)
    }
  })

  test("higher score for strong signals than for no signals", () => {
    const weak = analyzeIntake({ intakeText: "general awareness campaign" })
    const strong = analyzeIntake({
      intakeText: "launching new program with compliance and referral enablement for providers",
    })
    expect(strong.confidenceScore).toBeGreaterThan(weak.confidenceScore)
  })
})

// Item 3: Split compliance flags

describe("requiresVisibilityArchive and requiresApprovalWorkflow (Item 3)", () => {
  test("requiresVisibilityArchive true when compliance signal present", () => {
    const result = analyzeIntake({
      intakeText: "We need to demonstrate compliance for our state licensing audit",
    })
    expect(result.requiresVisibilityArchive).toBe(true)
  })

  test("requiresVisibilityArchive true when compliance-visibility signal present", () => {
    const result = analyzeIntake({
      intakeText: "Annual report for board review showing demonstrate compliance",
    })
    expect(result.requiresVisibilityArchive).toBe(true)
  })

  test("requiresApprovalWorkflow false when only compliance signal (no explicit gate terms)", () => {
    const result = analyzeIntake({
      intakeText: "We follow HIPAA compliance and are state-licensed",
    })
    expect(result.requiresApprovalWorkflow).toBe(false)
  })

  test("requiresApprovalWorkflow true when explicit approval gate terms present", () => {
    const result = analyzeIntake({
      intakeText: "All content review required before publish; approval required from compliance officer",
    })
    expect(result.requiresApprovalWorkflow).toBe(true)
  })

  test("both flags can be true simultaneously", () => {
    const result = analyzeIntake({
      intakeText: "Demonstrate compliance for annual report. Approval required before any send.",
    })
    expect(result.requiresVisibilityArchive).toBe(true)
    expect(result.requiresApprovalWorkflow).toBe(true)
  })

  test("both flags false for general awareness campaign", () => {
    const result = analyzeIntake({
      intakeText: "Community awareness campaign about mental health support",
    })
    expect(result.requiresVisibilityArchive).toBe(false)
    expect(result.requiresApprovalWorkflow).toBe(false)
  })
})

// Item 2: evidence map

describe("evidence map (Item 2)", () => {
  test("evidence keys match detectedSignalKeys", () => {
    const result = analyzeIntake({
      intakeText: "Launching new program. Email drip for providers. Social media campaign.",
    })
    for (const key of result.detectedSignalKeys) {
      if (key !== "stakeholders-unclear") {
        expect(result.evidence).toHaveProperty(key)
        expect((result.evidence as Record<string, string[]>)[key].length).toBeGreaterThan(0)
      }
    }
  })

  test("evidence arrays contain the actual matched term strings", () => {
    const result = analyzeIntake({ intakeText: "launching a new program rollout" })
    expect(result.evidence["launch"]).toContain("launch")
  })
})

// Item 4: stack

describe("campaign stack (Item 4)", () => {
  test("stack is non-empty for program-launch archetype", () => {
    const result = analyzeIntake({ intakeText: "We are launching a new program" })
    expect(result.primaryArchetype).toBe("program-launch")
    expect(result.stack.length).toBeGreaterThanOrEqual(3)
    expect(result.stack.length).toBeLessThanOrEqual(6)
  })

  test("stack is non-empty for referral-enablement archetype", () => {
    const result = analyzeIntake({
      intakeText: "Provider referral enablement for physicians and care managers",
    })
    expect(result.primaryArchetype).toBe("referral-enablement")
    expect(result.stack.length).toBeGreaterThanOrEqual(3)
  })

  test("stack is non-empty for trust-building archetype", () => {
    const result = analyzeIntake({ intakeText: "Community awareness and stigma reduction outreach" })
    expect(result.primaryArchetype).toBe("trust-building")
    expect(result.stack.length).toBeGreaterThanOrEqual(3)
  })

  test("stack is non-empty for compliance-visibility archetype", () => {
    const result = analyzeIntake({
      intakeText: "Demonstrate compliance for annual report and performance dashboard for board",
    })
    expect(result.primaryArchetype).toBe("compliance-visibility")
    expect(result.stack.length).toBeGreaterThanOrEqual(3)
  })
})
