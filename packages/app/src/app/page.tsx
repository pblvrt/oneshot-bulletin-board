'use client'

import { useState, useEffect } from 'react'
import { Board } from '@/components/Board'
import { SubmitJob } from '@/components/SubmitJob'
import { Job } from '@/utils/types'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [source, setSource] = useState<string>('loading')
  const [loading, setLoading] = useState(true)

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
      setSource(data.source || 'unknown')
    } catch {
      setSource('offline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])
    // Refetch after a delay to get the real onchain state
    setTimeout(fetchJobs, 5000)
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
          <span className={`badge badge-sm ${source === 'acp' ? 'badge-success' : 'badge-ghost'}`}>
            {source === 'acp' ? 'Live (ACP)' : source === 'loading' ? 'Loading...' : source}
          </span>
          <span className='text-xs opacity-40 font-mono'>{jobs.length} jobs</span>
          <SubmitJob onSubmit={handleSubmit} />
        </div>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <span className='loading loading-spinner loading-lg opacity-20' />
        </div>
      ) : (
        <Board jobs={jobs} />
      )}
    </div>
  )
}
