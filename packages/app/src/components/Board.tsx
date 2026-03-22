'use client'

import { Job, PHASES_ORDER, PHASE_CONFIG, JobPhase } from '@/utils/types'
import { JobCard } from './JobCard'

const VISIBLE_PHASES: JobPhase[] = ['open', 'funded', 'submitted', 'completed']

export function Board({ jobs, onAction }: { jobs: Job[]; onAction?: (action: string, job: Job) => void }) {
  const grouped = PHASES_ORDER.reduce(
    (acc, phase) => {
      acc[phase] = jobs.filter((j) => j.phase === phase)
      return acc
    },
    {} as Record<JobPhase, Job[]>
  )

  return (
    <div>
      <div className='grid grid-cols-4 gap-3 min-w-0'>
        {VISIBLE_PHASES.map((phase) => {
          const config = PHASE_CONFIG[phase]
          const phaseJobs = grouped[phase]

          return (
            <div key={phase} className='min-w-0'>
              {/* Column header */}
              <div className='flex items-center gap-2 mb-3 px-1'>
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className='text-sm font-semibold tracking-tight'>{config.label}</span>
                {phaseJobs.length > 0 && (
                  <span className='bg-base-content/10 text-xs font-mono px-1.5 py-0.5 rounded-md'>
                    {phaseJobs.length}
                  </span>
                )}
                <span className='text-[10px] opacity-15 ml-auto font-mono uppercase tracking-wider'>{config.erc8183}</span>
              </div>

              {/* Column body */}
              <div className='flex flex-col gap-2.5 min-h-[400px] bg-base-200/20 rounded-2xl p-2.5 border border-base-content/3'>
                {phaseJobs.map((job) => (
                  <JobCard key={job.id} job={job} onAction={onAction} />
                ))}
                {phaseJobs.length === 0 && (
                  <div className='flex items-center justify-center h-32 text-xs opacity-15'>
                    No jobs
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
