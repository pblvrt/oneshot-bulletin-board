'use client'

import { Job, PHASES_ORDER, PHASE_CONFIG, JobPhase } from '@/utils/types'
import { JobCard } from './JobCard'

export function Board({ jobs, onAction }: { jobs: Job[]; onAction?: (action: string, job: Job) => void }) {
  const grouped = PHASES_ORDER.reduce(
    (acc, phase) => {
      acc[phase] = jobs.filter((j) => j.phase === phase)
      return acc
    },
    {} as Record<JobPhase, Job[]>
  )

  const activePhases = PHASES_ORDER.filter(
    (phase) => grouped[phase].length > 0 || ['open', 'funded', 'submitted', 'completed'].includes(phase)
  )

  return (
    <div className='overflow-x-auto'>
      <div className='flex gap-4 min-w-max'>
        {activePhases.map((phase) => {
          const config = PHASE_CONFIG[phase]
          const phaseJobs = grouped[phase]

          return (
            <div key={phase} className='w-72 flex-shrink-0'>
              <div className='flex items-center gap-2 mb-3 px-1'>
                <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <span className='text-sm font-semibold'>{config.label}</span>
                {phaseJobs.length > 0 && (
                  <span className='text-xs opacity-30'>{phaseJobs.length}</span>
                )}
                <span className='text-xs opacity-20 ml-auto font-mono'>{config.erc8183}</span>
              </div>

              <div className='flex flex-col gap-2 min-h-[300px] bg-base-200/30 rounded-xl p-2'>
                {phaseJobs.map((job) => (
                  <JobCard key={job.id} job={job} onAction={onAction} />
                ))}
                {phaseJobs.length === 0 && (
                  <div className='flex items-center justify-center h-24 text-xs opacity-20'>
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
