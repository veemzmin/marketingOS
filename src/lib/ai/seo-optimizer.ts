export interface SEOAnalysis {
  score: number; // 0-100
  factors: {
    keywordDensity: { score: number; recommendation: string };
    headingStructure: { score: number; recommendation: string };
    metaDescription: { score: number; recommendation: string };
    readability: { score: number; recommendation: string };
    wordCount: { score: number; recommendation: string };
  };
}

/**
 * Analyze blog content for SEO
 */
export function analyzeSEO(
  content: string,
  keywords: string[],
  metaDescription?: string
): SEOAnalysis {
  const factors = {
    keywordDensity: analyzeKeywordDensity(content, keywords),
    headingStructure: analyzeHeadingStructure(content),
    metaDescription: analyzeMetaDescription(metaDescription),
    readability: analyzeReadability(content),
    wordCount: analyzeWordCount(content),
  };

  // Calculate overall score (weighted average)
  const score =
    factors.keywordDensity.score * 0.25 +
    factors.headingStructure.score * 0.2 +
    factors.metaDescription.score * 0.15 +
    factors.readability.score * 0.2 +
    factors.wordCount.score * 0.2;

  return {
    score: Math.round(score),
    factors,
  };
}

function analyzeKeywordDensity(
  content: string,
  keywords: string[]
): { score: number; recommendation: string } {
  if (keywords.length === 0) {
    return {
      score: 50,
      recommendation: "Add keywords to analyze density",
    };
  }

  const words = content.toLowerCase().split(/\s+/);
  const primaryKeyword = keywords[0].toLowerCase();
  const occurrences = words.filter((w) => w.includes(primaryKeyword)).length;
  const density = (occurrences / words.length) * 100;

  if (density < 0.5) {
    return {
      score: 40,
      recommendation: `Primary keyword appears ${occurrences} times. Use it more naturally (target: 0.5-2%)`,
    };
  } else if (density > 2.5) {
    return {
      score: 50,
      recommendation: `Keyword density too high (${density.toFixed(1)}%). Reduce to avoid keyword stuffing`,
    };
  } else {
    return {
      score: 100,
      recommendation: `Good keyword density (${density.toFixed(1)}%)`,
    };
  }
}

function analyzeHeadingStructure(content: string): {
  score: number;
  recommendation: string;
} {
  const h1Count = (content.match(/^#\s+/gm) || []).length;
  const h2Count = (content.match(/^##\s+/gm) || []).length;
  const h3Count = (content.match(/^###\s+/gm) || []).length;

  if (h1Count === 0) {
    return {
      score: 20,
      recommendation: "Add a main H1 heading",
    };
  }

  if (h1Count > 1) {
    return {
      score: 60,
      recommendation: "Use only one H1 heading per page",
    };
  }

  if (h2Count < 2) {
    return {
      score: 70,
      recommendation: "Add more H2 subheadings to structure content (target: 3-5)",
    };
  }

  return {
    score: 100,
    recommendation: `Good heading structure (H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count})`,
  };
}

function analyzeMetaDescription(metaDescription?: string): {
  score: number;
  recommendation: string;
} {
  if (!metaDescription) {
    return {
      score: 0,
      recommendation: "Add a meta description (150-160 characters)",
    };
  }

  const length = metaDescription.length;

  if (length < 120) {
    return {
      score: 60,
      recommendation: `Meta description too short (${length} chars). Aim for 150-160.`,
    };
  }

  if (length > 160) {
    return {
      score: 70,
      recommendation: `Meta description too long (${length} chars). Trim to 150-160.`,
    };
  }

  return {
    score: 100,
    recommendation: `Perfect meta description length (${length} chars)`,
  };
}

function analyzeReadability(content: string): {
  score: number;
  recommendation: string;
} {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = content.split(/\s+/);
  const avgWordsPerSentence = words.length / sentences.length;

  if (avgWordsPerSentence > 25) {
    return {
      score: 60,
      recommendation: `Sentences average ${avgWordsPerSentence.toFixed(1)} words. Aim for under 25 for better readability.`,
    };
  }

  return {
    score: 100,
    recommendation: `Good readability (${avgWordsPerSentence.toFixed(1)} words/sentence)`,
  };
}

function analyzeWordCount(content: string): {
  score: number;
  recommendation: string;
} {
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

  if (wordCount < 300) {
    return {
      score: 40,
      recommendation: `Content too short (${wordCount} words). Aim for 800-1500 for blog posts.`,
    };
  }

  if (wordCount < 600) {
    return {
      score: 70,
      recommendation: `Content length OK (${wordCount} words). 800-1500 is ideal for SEO.`,
    };
  }

  if (wordCount > 2500) {
    return {
      score: 80,
      recommendation: `Content very long (${wordCount} words). Consider breaking into series.`,
    };
  }

  return {
    score: 100,
    recommendation: `Excellent word count (${wordCount} words)`,
  };
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(
  content: string,
  keyword: string,
  maxLength: number = 155
): string {
  // Find first paragraph that contains the keyword
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

  for (const para of paragraphs) {
    if (para.toLowerCase().includes(keyword.toLowerCase())) {
      // Clean markdown and truncate
      const cleaned = para
        .replace(/#{1,6}\s+/g, "")
        .replace(/[*_`]/g, "")
        .trim();

      if (cleaned.length <= maxLength) {
        return cleaned;
      }

      return cleaned.substring(0, maxLength - 3) + "...";
    }
  }

  // Fallback: use first paragraph
  const firstPara = paragraphs[0]
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`]/g, "")
    .trim();

  if (firstPara.length <= maxLength) {
    return firstPara;
  }

  return firstPara.substring(0, maxLength - 3) + "...";
}

/**
 * Suggest heading structure based on topic and keywords
 */
export function suggestHeadings(
  topic: string,
  keywords: string[]
): string[] {
  return [
    `# ${topic}: A Complete Guide`,
    `## Understanding ${keywords[0] || topic}`,
    `## Key Benefits and Considerations`,
    `## How to Get Started`,
    `## Frequently Asked Questions`,
    `## Next Steps`,
  ];
}
