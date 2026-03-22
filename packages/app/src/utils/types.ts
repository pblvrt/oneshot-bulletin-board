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

export const PHASE_CONFIG: Record<JobPhase, { label: string; color: string; dot: string; erc8183: string }> = {
  open: { label: 'Open', color: 'badge-ghost', dot: 'bg-zinc-400', erc8183: 'REQUEST' },
  funded: { label: 'Funded', color: 'badge-info', dot: 'bg-blue-400', erc8183: 'TRANSACTION' },
  submitted: { label: 'Submitted', color: 'badge-warning', dot: 'bg-amber-400', erc8183: 'EVALUATION' },
  completed: { label: 'Completed', color: 'badge-success', dot: 'bg-emerald-400', erc8183: 'COMPLETED' },
  rejected: { label: 'Rejected', color: 'badge-error', dot: 'bg-red-400', erc8183: 'REJECTED' },
  expired: { label: 'Expired', color: 'badge-ghost opacity-50', dot: 'bg-zinc-600', erc8183: 'EXPIRED' },
}

export const PHASES_ORDER: JobPhase[] = ['open', 'funded', 'submitted', 'completed', 'rejected', 'expired']
