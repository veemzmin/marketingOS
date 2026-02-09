export interface PromptContext {
  topic: string;
  audience: "patients" | "families" | "professionals" | "general";
  tone: "informative" | "supportive" | "clinical" | "motivational";
  contentType: "blog" | "social";
  platform?: "instagram" | "facebook" | "linkedin" | "twitter";
  keywords?: string[];
  additionalInstructions?: string;
}

// Stigmatizing terms to avoid in healthcare content
const STIGMATIZING_TERMS = [
  "addict",
  "junkie",
  "alcoholic",
  "crazy",
  "insane",
  "psycho",
  "schizo",
  "committed suicide",
  "drug abuser",
  "mental patient",
];

// Required governance rules for healthcare content
const GOVERNANCE_RULES = `
MANDATORY GOVERNANCE RULES - NEVER VIOLATE:

1. **Medical Claims**: Never make unsupported medical claims. Always use qualified language:
   - Use "may help", "research suggests", "studies show"
   - Always add "consult your healthcare provider" for medical advice
   - Cite sources when making factual claims

2. **Stigmatizing Language**: NEVER use these terms: ${STIGMATIZING_TERMS.join(", ")}
   - Use person-first language: "person with depression" NOT "depressed person"
   - Use "substance use disorder" NOT "addiction" or "drug abuse"
   - Use "died by suicide" NOT "committed suicide"

3. **Crisis Resources**: Any mention of suicide, self-harm, or crisis MUST include:
   - National Suicide Prevention Lifeline: 988
   - Crisis Text Line: Text HOME to 741741
   - Include "If you're in crisis, help is available 24/7"

4. **Treatment Advice**: All treatment recommendations must be qualified:
   - "Under professional guidance..."
   - "Work with your healthcare provider to..."
   - Never prescribe specific medications or dosages

5. **Patient Stories**: If including testimonials or patient stories:
   - Must state "Shared with explicit consent"
   - Use first names only or pseudonyms
   - Never include identifiable information

6. **Clinical Terminology**: Use correct DSM-5 terminology for diagnoses:
   - Major Depressive Disorder (not just "depression")
   - Generalized Anxiety Disorder (not just "anxiety")
   - Include proper diagnostic qualifiers

7. **Empathy & Hope**: Always maintain:
   - Trauma-informed language
   - Hopeful, recovery-oriented messaging
   - Non-judgmental tone
   - Emphasis on treatment effectiveness
`;

/**
 * Build a governance-aware prompt for AI content generation
 */
export function buildGovernedPrompt(context: PromptContext): string {
  const {
    topic,
    audience,
    tone,
    contentType,
    platform,
    keywords = [],
    additionalInstructions = "",
  } = context;

  // Audience-specific guidance
  const audienceGuidance = {
    patients:
      "Write directly to individuals experiencing these conditions. Use accessible language, provide hope and validation, emphasize that recovery is possible.",
    families:
      "Address caregivers and family members. Acknowledge their challenges, provide practical support strategies, emphasize the importance of their own well-being.",
    professionals:
      "Write for healthcare providers, therapists, counselors. Use clinical language where appropriate, focus on evidence-based practices, include research citations.",
    general:
      "Write for a broad audience with varying levels of mental health literacy. Balance accessibility with accuracy.",
  };

  // Platform-specific constraints
  const platformGuidance = platform
    ? {
        instagram:
          "Instagram post style: Start with a compelling hook. Use 3-5 relevant hashtags. Include emojis strategically. Keep under 2200 characters but aim for 150-200 words for optimal engagement.",
        facebook:
          "Facebook post style: Can be longer (80-100 words optimal). Use conversational tone. Questions drive engagement. Link previews supported.",
        linkedin:
          "LinkedIn post style: Professional tone. Thought-provoking content. Include a question to encourage discussion. Use 3-5 professional hashtags. 150-200 words optimal.",
        twitter:
          "Twitter/X post style: Concise and impactful. 280 character limit. Front-load key message. Use 2-3 hashtags max. Thread if needed.",
      }[platform]
    : "";

  // Build the complete prompt
  return `
You are an expert healthcare content writer specializing in mental health, substance use, and wellness content. You create ${contentType} content that is clinically accurate, compassionate, and compliant with healthcare marketing regulations.

${GOVERNANCE_RULES}

ASSIGNMENT:
Generate ${contentType} content about "${topic}"

TARGET AUDIENCE: ${audience}
${audienceGuidance[audience]}

TONE: ${tone}
Make the content ${tone} while maintaining clinical accuracy and empathy.

${platform ? `PLATFORM: ${platform}\n${platformGuidance}` : ""}

${keywords.length > 0 ? `KEYWORDS: Naturally incorporate these terms: ${keywords.join(", ")}` : ""}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}` : ""}

CONTENT REQUIREMENTS:
- Open with a compelling, empathetic hook
- Provide actionable, evidence-based information
- Include specific examples or scenarios when appropriate
- End with a clear call-to-action or next step
- Ensure content provides value and hope

Remember: Every word matters in healthcare content. Prioritize accuracy, empathy, and safety above all else.

Generate the content now:
`.trim();
}

/**
 * Build prompt with injected knowledge base facts
 */
export function augmentPromptWithFacts(
  prompt: string,
  facts: Array<{ claim: string; source: string }>
): string {
  if (facts.length === 0) return prompt;

  const factsSection = `
VERIFIED FACTS TO REFERENCE:
${facts.map((f, i) => `${i + 1}. ${f.claim} (Source: ${f.source})`).join("\n")}

Use these verified facts to support your content. When referencing statistics or medical information, draw from these sources.
`;

  return `${factsSection}\n\n${prompt}`;
}

/**
 * Extract keywords from prompt context for knowledge base search
 */
export function extractSearchKeywords(context: PromptContext): string[] {
  const keywords: string[] = [];

  // Add topic as primary keyword
  keywords.push(context.topic);

  // Add any explicitly provided keywords
  if (context.keywords) {
    keywords.push(...context.keywords);
  }

  // Add audience-specific terms for better RAG
  if (context.audience === "families") {
    keywords.push("caregiver", "family support");
  } else if (context.audience === "professionals") {
    keywords.push("treatment", "therapy", "clinical");
  }

  return keywords;
}
