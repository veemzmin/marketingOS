export type ContentStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'

// State machine: defines allowed transitions
export const statusTransitions: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['SUBMITTED'], // Creator submits draft
  SUBMITTED: ['IN_REVIEW', 'DRAFT'], // Reviewer starts review OR creator cancels
  IN_REVIEW: ['APPROVED', 'REJECTED'], // Reviewer makes decision
  APPROVED: [], // Terminal state
  REJECTED: ['DRAFT'], // Creator can revise and resubmit
}

export function canTransitionTo(currentStatus: ContentStatus, newStatus: ContentStatus): boolean {
  return statusTransitions[currentStatus].includes(newStatus)
}

export interface ContentWithVersion {
  id: string
  title: string
  status: ContentStatus
  complianceScore: number | null
  createdAt: Date
  updatedAt: Date
  latestVersion: {
    versionNumber: number
    body: string
    topic: string
    audience: string
    tone: string
    complianceScore: number
  } | null
}
