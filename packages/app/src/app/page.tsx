'use client'

import { useState, useEffect, useCallback } from 'react'
import { Board } from '@/components/Board'
import { SubmitJob } from '@/components/SubmitJob'
import { Job } from '@/utils/types'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [source, setSource] = useState<string>('loading')
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      if (data.jobs?.length) {
        setJobs(data.jobs)
      }
      setSource(data.source || 'unknown')
    } catch {
      setSource('offline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    // Poll every 15s for new jobs/phase updates
    const interval = setInterval(fetchJobs, 15000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])
    // Refetch after delay to pick up the onchain event
    setTimeout(fetchJobs, 8000)
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
          <span className={`badge badge-sm ${source === 'onchain' ? 'badge-success' : 'badge-ghost'}`}>
            {source === 'onchain' ? 'Live (Base)' : source === 'loading' ? 'Loading...' : source}
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
