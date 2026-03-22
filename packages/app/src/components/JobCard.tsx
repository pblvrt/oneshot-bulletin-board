'use client'

import { Job, PHASE_CONFIG } from '@/utils/types'

function truncateAddress(addr: string) {
  if (addr.length <= 13) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function JobCard({ job }: { job: Job }) {
  const config = PHASE_CONFIG[job.phase]

  return (
    <div className='card bg-base-200 shadow-sm'>
      <div className='card-body p-4 gap-2'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='card-title text-sm'>{job.title}</h3>
          <span className={`badge badge-sm ${config.color}`}>{config.label}</span>
        </div>

        <p className='text-xs opacity-60 line-clamp-2'>{job.description}</p>

        <div className='flex items-center justify-between mt-1'>
          <div className='flex items-center gap-2 text-xs opacity-50'>
            <code>{truncateAddress(job.client)}</code>
            <span>·</span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
          <span className='badge badge-sm badge-outline font-mono'>{job.budget}</span>
        </div>

        {job.deliverable && (
          <a href={job.deliverable} target='_blank' rel='noopener noreferrer' className='link link-info text-xs mt-1'>
            View deliverable →
          </a>
        )}
        {job.rejectReason && <p className='text-xs text-error mt-1'>{job.rejectReason}</p>}
      </div>
    </div>
  )
}
