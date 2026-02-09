"use client";

interface Violation {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  matchedText?: string;
}

interface ContentWithViolationsProps {
  content: string;
  violations: Violation[];
}

export function ContentWithViolations({
  content,
  violations,
}: ContentWithViolationsProps) {
  // For now, just display the content as-is
  // In a real implementation, we would:
  // 1. Parse the content
  // 2. Find text matching violations
  // 3. Wrap matches in highlight spans with tooltips
  // 4. Color-code by severity

  if (violations.length === 0) {
    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

  // Simple implementation: just show content with violations below
  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-2">Policy Violations in Text:</h4>
        <div className="space-y-2">
          {violations.map((violation, index) => (
            <div
              key={index}
              className={`p-2 rounded-md text-sm ${
                violation.severity === "high"
                  ? "bg-red-50 border border-red-200 text-red-900"
                  : violation.severity === "medium"
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-900"
                  : "bg-blue-50 border border-blue-200 text-blue-900"
              }`}
            >
              <div className="font-medium">{violation.type}</div>
              <div className="text-xs mt-1">{violation.message}</div>
              {violation.matchedText && (
                <div className="text-xs mt-1 italic">
                  &quot;{violation.matchedText}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
