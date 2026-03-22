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
      if (data.jobs) setJobs(data.jobs)
      setSource(data.source || 'unknown')
    } catch {
      setSource('offline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 10000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])
    setTimeout(fetchJobs, 3000)
  }

  async function handleAction(action: string, job: Job) {
    let body: Record<string, unknown> = { id: job.id }

    switch (action) {
      case 'accept':
        body.phase = 'funded'
        break
      case 'deliver': {
        const url = prompt('Enter deliverable URL:')
        if (!url) return
        body.phase = 'submitted'
        body.deliverable = url
        break
      }
      case 'approve':
        body.phase = 'completed'
        body.memoId = 0 // TODO: track real memo IDs
        break
      case 'reject': {
        const reason = prompt('Rejection reason:')
        if (!reason) return
        body.phase = 'rejected'
        body.rejectReason = reason
        body.memoId = 0
        break
      }
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const updated = await res.json()
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)))
    } catch (e) {
      console.error('Action failed:', e)
    }
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
          <span className={`badge badge-sm ${source === 'crm' ? 'badge-success' : 'badge-ghost'}`}>
            {source === 'crm' ? 'Live' : source === 'loading' ? 'Loading...' : source}
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
        <Board jobs={jobs} onAction={handleAction} />
      )}
    </div>
  )
}
