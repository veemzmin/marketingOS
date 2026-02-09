export type Platform = "instagram" | "facebook" | "linkedin" | "twitter";

export interface PlatformConstraints {
  maxLength: number;
  optimalLength: { min: number; max: number };
  maxHashtags: number;
  optimalHashtags: { min: number; max: number };
  features: string[];
}

const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  instagram: {
    maxLength: 2200,
    optimalLength: { min: 150, max: 200 },
    maxHashtags: 30,
    optimalHashtags: { min: 5, max: 10 },
    features: ["emojis", "carousel", "stories", "reels"],
  },
  facebook: {
    maxLength: 63206,
    optimalLength: { min: 80, max: 100 },
    maxHashtags: 10,
    optimalHashtags: { min: 1, max: 3 },
    features: ["linkPreview", "photos", "videos"],
  },
  linkedin: {
    maxLength: 3000,
    optimalLength: { min: 150, max: 200 },
    maxHashtags: 5,
    optimalHashtags: { min: 3, max: 5 },
    features: ["professional", "articles", "polls"],
  },
  twitter: {
    maxLength: 280,
    optimalLength: { min: 200, max: 280 },
    maxHashtags: 3,
    optimalHashtags: { min: 1, max: 2 },
    features: ["threads", "polls", "quotes"],
  },
};

/**
 * Optimize content for specific platform
 */
export function optimizeForPlatform(content: string, platform: Platform): string {
  const constraints = PLATFORM_CONSTRAINTS[platform];

  // Truncate if too long
  if (content.length > constraints.maxLength) {
    return content.substring(0, constraints.maxLength - 3) + "...";
  }

  return content;
}

/**
 * Suggest hashtags for content
 */
export function suggestHashtags(
  content: string,
  platform: Platform,
  options: {
    forbidden?: string[];
    required?: string[];
    topic?: string;
  } = {}
): string[] {
  const { forbidden = [], required = [], topic = "" } = options;
  const constraints = PLATFORM_CONSTRAINTS[platform];
  const suggested: string[] = [];

  // Add required hashtags first
  suggested.push(...required);

  // Generate topic-based hashtags
  if (topic) {
    const topicWords = topic.split(" ").filter((w) => w.length > 3);
    topicWords.forEach((word) => {
      const hashtag = `#${word.charAt(0).toUpperCase() + word.slice(1)}`;
      if (
        !forbidden.includes(hashtag) &&
        !suggested.includes(hashtag) &&
        suggested.length < constraints.optimalHashtags.max
      ) {
        suggested.push(hashtag);
      }
    });
  }

  // Add common mental health hashtags if relevant
  const commonHashtags = [
    "#MentalHealth",
    "#MentalHealthAwareness",
    "#Wellness",
    "#SelfCare",
    "#MentalHealthMatters",
    "#EndStigma",
    "#YouAreNotAlone",
    "#Recovery",
  ];

  for (const hashtag of commonHashtags) {
    if (
      !forbidden.includes(hashtag) &&
      !suggested.includes(hashtag) &&
      suggested.length < constraints.optimalHashtags.max
    ) {
      // Check if content is related
      const hashtagWord = hashtag.replace("#", "").toLowerCase();
      if (content.toLowerCase().includes(hashtagWord.substring(0, 6))) {
        suggested.push(hashtag);
      }
    }
  }

  // Limit to optimal range
  return suggested.slice(0, constraints.optimalHashtags.max);
}

/**
 * Suggest posting times based on platform and audience
 */
export function suggestPostingTime(
  platform: Platform,
  audience: string,
  timezone: string = "America/New_York"
): Array<{ day: string; time: string; reason: string }> {
  // Best times based on platform research
  const timings: Record<
    Platform,
    Array<{ day: string; time: string; reason: string }>
  > = {
    instagram: [
      {
        day: "Wednesday",
        time: "11:00 AM",
        reason: "Peak engagement for Instagram posts",
      },
      {
        day: "Friday",
        time: "10:00 AM",
        reason: "High story views before weekend",
      },
      {
        day: "Sunday",
        time: "9:00 AM",
        reason: "Weekend morning browsing peak",
      },
    ],
    facebook: [
      {
        day: "Wednesday",
        time: "1:00 PM",
        reason: "Lunch break engagement",
      },
      {
        day: "Thursday",
        time: "3:00 PM",
        reason: "Afternoon scroll peak",
      },
      {
        day: "Sunday",
        time: "12:00 PM",
        reason: "Weekend leisure browsing",
      },
    ],
    linkedin: [
      {
        day: "Tuesday",
        time: "9:00 AM",
        reason: "Professional start of workday",
      },
      {
        day: "Wednesday",
        time: "12:00 PM",
        reason: "Midweek lunch break check-in",
      },
      {
        day: "Thursday",
        time: "5:00 PM",
        reason: "End of workday browsing",
      },
    ],
    twitter: [
      {
        day: "Wednesday",
        time: "9:00 AM",
        reason: "Morning news consumption",
      },
      {
        day: "Friday",
        time: "12:00 PM",
        reason: "Lunch break scrolling",
      },
      {
        day: "Saturday",
        time: "10:00 AM",
        reason: "Weekend catch-up",
      },
    ],
  };

  return timings[platform];
}

/**
 * Get character count with hashtags
 */
export function getCharacterCount(content: string, hashtags: string[]): number {
  const hashtagString = hashtags.join(" ");
  return content.length + (hashtagString.length > 0 ? hashtagString.length + 2 : 0); // +2 for newline
}

/**
 * Validate content against platform constraints
 */
export function validatePlatformContent(
  content: string,
  platform: Platform,
  hashtags: string[]
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalLength = getCharacterCount(content, hashtags);

  if (totalLength > constraints.maxLength) {
    errors.push(
      `Content exceeds ${platform} limit (${totalLength}/${constraints.maxLength} chars)`
    );
  }

  if (hashtags.length > constraints.maxHashtags) {
    errors.push(
      `Too many hashtags (${hashtags.length}/${constraints.maxHashtags} max)`
    );
  }

  if (
    totalLength < constraints.optimalLength.min ||
    totalLength > constraints.optimalLength.max
  ) {
    warnings.push(
      `Content length (${totalLength} chars) outside optimal range (${constraints.optimalLength.min}-${constraints.optimalLength.max})`
    );
  }

  if (
    hashtags.length < constraints.optimalHashtags.min ||
    hashtags.length > constraints.optimalHashtags.max
  ) {
    warnings.push(
      `Hashtag count (${hashtags.length}) outside optimal range (${constraints.optimalHashtags.min}-${constraints.optimalHashtags.max})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
