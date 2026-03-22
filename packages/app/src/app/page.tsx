'use client'

import { useState } from 'react'
import { Board } from '@/components/Board'
import { SubmitJob } from '@/components/SubmitJob'
import { Job } from '@/utils/types'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Job Board</h2>
          <p className='text-sm opacity-50 mt-1'>
            Submit a project → Oneshot builds it → Get your deliverable
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-xs opacity-40 font-mono'>{jobs.length} jobs</span>
          <SubmitJob onSubmit={handleSubmit} />
        </div>
      </div>

      <Board jobs={jobs} />
    </div>
  )
}
