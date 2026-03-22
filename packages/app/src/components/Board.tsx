'use client'

import { Job, PHASES_ORDER, PHASE_CONFIG, JobPhase } from '@/utils/types'
import { JobCard } from './JobCard'

export function Board({ jobs }: { jobs: Job[] }) {
  const grouped = PHASES_ORDER.reduce(
    (acc, phase) => {
      acc[phase] = jobs.filter((j) => j.phase === phase)
      return acc
    },
    {} as Record<JobPhase, Job[]>
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4'>
      {PHASES_ORDER.map((phase) => {
        const config = PHASE_CONFIG[phase]
        const phaseJobs = grouped[phase]

        return (
          <div key={phase} className='flex flex-col gap-2'>
            <div className='flex items-center gap-2 px-1'>
              <span className={`badge badge-xs ${config.color}`} />
              <span className='text-sm font-semibold'>{config.label}</span>
              <span className='text-xs opacity-40 ml-auto'>{phaseJobs.length}</span>
            </div>
            <div className='text-xs opacity-30 px-1 font-mono'>{config.erc8183}</div>
            <div className='flex flex-col gap-2 min-h-[120px]'>
              {phaseJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {phaseJobs.length === 0 && (
                <div className='border border-dashed border-base-content/10 rounded-lg p-4 text-xs opacity-30 text-center'>
                  No jobs
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
