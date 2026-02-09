export interface ClaimCheckResult {
  claim: string;
  verified: boolean;
  confidence: number;
  source?: string;
  flagForReview: boolean;
}

// Patterns that indicate medical/health claims requiring verification
const MEDICAL_CLAIM_PATTERNS = [
  /\d+%\s+of\s+(people|patients|individuals)/i,
  /(studies|research|evidence)\s+(show|suggest|indicate)/i,
  /(treatment|therapy|medication)\s+(is|are)\s+(effective|proven)/i,
  /(cure|heal|treat|prevent)\s+\w+/i,
  /(always|never|guaranteed|proven)\s+(to|will)/i,
  /clinical\s+(trial|study|research)/i,
];

// Medical terminology that requires careful verification
const MEDICAL_TERMS = [
  "diagnosis",
  "disorder",
  "syndrome",
  "symptom",
  "treatment",
  "medication",
  "therapy",
  "clinical",
  "psychiatric",
  "psychological",
];

/**
 * Check generated content against knowledge base
 * This is a simplified version - in production, you'd use more sophisticated NLP
 */
export async function verifyHealthClaims(
  content: string,
  knowledgeBase: Array<{ claim: string; source: string }> = []
): Promise<ClaimCheckResult[]> {
  const results: ClaimCheckResult[] = [];
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const sentence of sentences) {
    // Check if sentence contains medical claim patterns
    const containsMedicalClaim = MEDICAL_CLAIM_PATTERNS.some((pattern) =>
      pattern.test(sentence)
    );

    if (containsMedicalClaim) {
      // Try to find matching fact in knowledge base
      const matchedFact = knowledgeBase.find((fact) =>
        sentence.toLowerCase().includes(fact.claim.toLowerCase().substring(0, 50))
      );

      if (matchedFact) {
        results.push({
          claim: sentence,
          verified: true,
          confidence: 0.8,
          source: matchedFact.source,
          flagForReview: false,
        });
      } else {
        // Unverified medical claim - flag for review
        results.push({
          claim: sentence,
          verified: false,
          confidence: 0.3,
          flagForReview: true,
        });
      }
    }

    // Check for medical terms without qualifiers
    const lowerSentence = sentence.toLowerCase();
    const containsMedicalTerm = MEDICAL_TERMS.some((term) =>
      lowerSentence.includes(term)
    );

    if (
      containsMedicalTerm &&
      !hasQualifiers(sentence) &&
      !results.some((r) => r.claim === sentence)
    ) {
      results.push({
        claim: sentence,
        verified: false,
        confidence: 0.5,
        flagForReview: true,
      });
    }
  }

  return results;
}

/**
 * Check if sentence has appropriate qualifiers for medical claims
 */
function hasQualifiers(sentence: string): boolean {
  const qualifiers = [
    "may",
    "might",
    "could",
    "can",
    "suggests",
    "indicates",
    "research shows",
    "studies suggest",
    "consult",
    "healthcare provider",
    "medical professional",
    "under supervision",
  ];

  const lowerSentence = sentence.toLowerCase();
  return qualifiers.some((q) => lowerSentence.includes(q));
}

/**
 * Mark unverified claims in content with annotations
 * Returns content with HTML markers for flagged claims
 */
export function flagUnverifiedClaims(
  content: string,
  claims: ClaimCheckResult[]
): string {
  let flaggedContent = content;
  const unverifiedClaims = claims.filter((c) => !c.verified && c.flagForReview);

  for (const claim of unverifiedClaims) {
    // Wrap unverified claim in marker
    flaggedContent = flaggedContent.replace(
      claim.claim,
      `[UNVERIFIED: ${claim.claim}]`
    );
  }

  return flaggedContent;
}

/**
 * Calculate verification score for content
 * Returns score 0-100 based on verified vs unverified claims
 */
export function calculateVerificationScore(claims: ClaimCheckResult[]): number {
  if (claims.length === 0) return 100; // No medical claims = safe

  const verifiedCount = claims.filter((c) => c.verified).length;
  const score = (verifiedCount / claims.length) * 100;

  return Math.round(score);
}
