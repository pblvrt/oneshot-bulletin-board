export interface State<T> {
  loading: boolean
  data?: T
  error?: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  type: NotificationType
  message: string
  timestamp: number
  from?: string
  href?: string
}

// ERC-8183 Job types
export type JobPhase = 'open' | 'funded' | 'submitted' | 'completed' | 'rejected' | 'expired'

export interface Job {
  id: string
  title: string
  description: string
  client: string
  budget: string
  phase: JobPhase
  createdAt: string
  deliverable?: string
  rejectReason?: string
}

export const PHASE_CONFIG: Record<JobPhase, { label: string; color: string; erc8183: string }> = {
  open: { label: 'Open', color: 'badge-ghost', erc8183: 'REQUEST' },
  funded: { label: 'Funded', color: 'badge-info', erc8183: 'TRANSACTION' },
  submitted: { label: 'Submitted', color: 'badge-warning', erc8183: 'EVALUATION' },
  completed: { label: 'Completed', color: 'badge-success', erc8183: 'COMPLETED' },
  rejected: { label: 'Rejected', color: 'badge-error', erc8183: 'REJECTED' },
  expired: { label: 'Expired', color: 'badge-ghost opacity-50', erc8183: 'EXPIRED' },
}

export const PHASES_ORDER: JobPhase[] = ['open', 'funded', 'submitted', 'completed', 'rejected', 'expired']
