'use client'

import { Job, PHASE_CONFIG } from '@/utils/types'

function truncateAddress(addr: string) {
  if (!addr || addr.length <= 13) return addr || 'unknown'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function JobCard({ job, onAction }: { job: Job; onAction?: (action: string, job: Job) => void }) {
  const config = PHASE_CONFIG[job.phase]

  return (
    <div className='bg-base-100 rounded-lg p-3 border border-base-content/5 hover:border-base-content/10 transition-colors'>
      <div className='flex items-start justify-between gap-2 mb-1.5'>
        <h3 className='text-sm font-medium leading-tight'>{job.title}</h3>
      </div>

      <p className='text-xs opacity-40 line-clamp-2 mb-2'>{job.description}</p>

      <div className='flex items-center gap-2 text-xs'>
        <code className='opacity-30'>{truncateAddress(job.client)}</code>
        <span className='opacity-20'>·</span>
        <span className='opacity-30'>{timeAgo(job.createdAt)}</span>
        <span className='ml-auto font-mono opacity-50'>{job.budget}</span>
      </div>

      {job.deliverable && (
        <a href={job.deliverable} target='_blank' rel='noopener noreferrer' className='text-xs text-info mt-2 block'>
          View deliverable →
        </a>
      )}
      {job.rejectReason && <p className='text-xs text-error opacity-70 mt-2'>{job.rejectReason}</p>}

      {/* Phase action buttons */}
      {onAction && (
        <div className='flex gap-1 mt-2'>
          {job.phase === 'open' && (
            <button className='btn btn-xs btn-info' onClick={() => onAction('accept', job)}>
              Accept
            </button>
          )}
          {job.phase === 'funded' && (
            <button className='btn btn-xs btn-warning' onClick={() => onAction('deliver', job)}>
              Submit Deliverable
            </button>
          )}
          {job.phase === 'submitted' && (
            <>
              <button className='btn btn-xs btn-success' onClick={() => onAction('approve', job)}>
                Approve
              </button>
              <button className='btn btn-xs btn-error' onClick={() => onAction('reject', job)}>
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
