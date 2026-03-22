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
    <div className='bg-base-100 rounded-xl p-4 border border-base-content/5 hover:border-base-content/15 transition-all shadow-sm hover:shadow-md'>
      {/* Header: title + phase badge */}
      <div className='flex items-start justify-between gap-2 mb-2'>
        <h3 className='text-sm font-semibold leading-snug'>{job.title}</h3>
        <span className={`badge badge-xs ${config.color} flex-shrink-0`}>{config.label}</span>
      </div>

      {/* Description */}
      <p className='text-xs opacity-50 line-clamp-2 mb-3 leading-relaxed'>{job.description}</p>

      {/* Budget pill */}
      {job.budget && job.budget !== 'TBD' && (
        <div className='flex items-center gap-1.5 mb-3'>
          <div className='bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium px-2 py-0.5 rounded-md'>
            {job.budget}
          </div>
          {job.phase === 'funded' && (
            <span className='text-[10px] opacity-30'>escrowed</span>
          )}
          {job.phase === 'completed' && (
            <span className='text-[10px] opacity-30'>released</span>
          )}
        </div>
      )}

      {/* Deliverable link */}
      {job.deliverable && (
        <a
          href={job.deliverable}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 text-xs text-info hover:text-info/80 mb-3 group'
        >
          <span className='w-1.5 h-1.5 rounded-full bg-info animate-pulse' />
          <span className='group-hover:underline'>{job.deliverable.replace('https://', '')}</span>
          <span className='opacity-40'>→</span>
        </a>
      )}

      {/* Rejection reason */}
      {job.rejectReason && (
        <p className='text-xs text-error/70 bg-error/5 rounded-md px-2 py-1 mb-3'>{job.rejectReason}</p>
      )}

      {/* Footer: address + time */}
      <div className='flex items-center gap-2 text-[11px] opacity-40'>
        <code>{truncateAddress(job.client)}</code>
        <span>·</span>
        <span>{timeAgo(job.createdAt)}</span>
      </div>

      {/* Action buttons */}
      {onAction && (
        <div className='flex gap-2 mt-3 pt-3 border-t border-base-content/5'>
          {job.phase === 'open' && (
            <button className='btn btn-xs btn-primary gap-1' onClick={() => onAction('accept', job)}>
              Accept Job
            </button>
          )}
          {job.phase === 'funded' && (
            <button className='btn btn-xs btn-warning gap-1' onClick={() => onAction('deliver', job)}>
              Submit Deliverable
            </button>
          )}
          {job.phase === 'submitted' && (
            <>
              <button className='btn btn-xs btn-success gap-1' onClick={() => onAction('approve', job)}>
                Approve
              </button>
              <button className='btn btn-xs btn-ghost btn-error gap-1' onClick={() => onAction('reject', job)}>
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
