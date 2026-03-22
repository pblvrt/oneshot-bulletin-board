'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Board } from '@/components/Board'
import { SubmitJob } from '@/components/SubmitJob'
import { Job } from '@/utils/types'
import { AgentTerminal, TerminalHandle } from '@/components/AgentTerminal'

function useIsDemo() {
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    setIsDemo(new URLSearchParams(window.location.search).get('demo') === 'true')
  }, [])
  return isDemo
}

export default function Home() {
  const isDemo = useIsDemo()
  const [jobs, setJobs] = useState<Job[]>([])
  const [source, setSource] = useState<string>('loading')
  const [loading, setLoading] = useState(true)
  const terminalRef = useRef<TerminalHandle>(null)

  // Normal mode: fetch from API
  const fetchJobs = useCallback(async () => {
    if (isDemo) return
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
  }, [isDemo])

  // Demo mode: load static data
  useEffect(() => {
    if (!isDemo) return
    import('@/utils/demo-data').then(({ DEMO_JOBS }) => {
      setJobs(DEMO_JOBS)
      setSource('onchain+crm')
      setLoading(false)
    })
  }, [isDemo])

  // Normal mode: poll API
  useEffect(() => {
    if (isDemo) return
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [fetchJobs, isDemo])

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])

    if (!isDemo) {
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: job.title, description: job.description, client: job.client, budget: job.budget.replace(' USDC', '') }),
      }).catch(() => {})
      setTimeout(fetchJobs, 3000)
      return
    }

    // Demo: run full lifecycle in terminal
    const { id, title: name, budget, client } = job

    setTimeout(() => {
      const t2 = terminalRef.current
      t2?.addLog({ level: 'dim', message: '─────────────────────────────' })
      t2?.addLog({ level: 'info', message: `📥 New job #${id} "${name}"` })
      t2?.addLog({ level: 'info', message: `  Client: ${client.slice(0,6)}...${client.slice(-4)} · Budget: ${budget}` })
    }, 2000)

    setTimeout(() => {
      const t2 = terminalRef.current
      t2?.addLog({ level: 'success', message: `✓ Accepted · ${budget} escrowed` })
      t2?.addLog({ level: 'info', message: `  create_project("${name.toLowerCase().replace(/\s+/g, '-')}")` })
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, phase: 'funded' as const } : j))
    }, 5000)

    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  Scoping requirements with AI...' }) }, 8000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  generate_document()' }) }, 10000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  create_sandbox()' }) }, 12000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  start_build()' }) }, 14000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  Building... 8 components' }) }, 17000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'info', message: '  Running tests...' }) }, 20000)
    setTimeout(() => { terminalRef.current?.addLog({ level: 'success', message: '  ✓ Tests 10/10 passed' }) }, 22000)

    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const url = `https://${slug}.oneshotapp.io`
    setTimeout(() => {
      const t2 = terminalRef.current
      t2?.addLog({ level: 'info', message: `  deploy()` })
      t2?.addLog({ level: 'success', message: `  ✓ Deployed ${url}` })
      t2?.addLog({ level: 'success', message: '  ✓ Deliverable submitted onchain' })
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, phase: 'submitted' as const, deliverable: url } : j))
    }, 26000)

    setTimeout(() => {
      const t2 = terminalRef.current
      t2?.addLog({ level: 'success', message: `🎉 Client approved "${name}"` })
      t2?.addLog({ level: 'success', message: `  ✓ ${budget} released to agent wallet` })
      t2?.addLog({ level: 'info', message: `  claimBudget(${id}) → tx confirmed` })
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, phase: 'completed' as const } : j))
    }, 33000)
  }

  async function handleAction(action: string, job: Job) {
    const body: Record<string, unknown> = { id: job.id }

    switch (action) {
      case 'accept': body.phase = 'funded'; break
      case 'deliver': {
        const url = prompt('Enter deliverable URL:')
        if (!url) return
        body.phase = 'submitted'; body.deliverable = url; break
      }
      case 'approve': body.phase = 'completed'; body.memoId = 0; break
      case 'reject': {
        const reason = prompt('Rejection reason:')
        if (!reason) return
        body.phase = 'rejected'; body.rejectReason = reason; body.memoId = 0; break
      }
    }

    if (isDemo) {
      // Demo: update locally
      setJobs((prev) => prev.map((j) => {
        if (j.id !== job.id) return j
        return { ...j, phase: body.phase as Job['phase'], deliverable: (body.deliverable as string) || j.deliverable, rejectReason: (body.rejectReason as string) || j.rejectReason }
      }))
      return
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
    <div className='flex flex-col h-[calc(100vh-4rem)]'>
      <div className='flex flex-col gap-4 flex-1 min-w-0 px-4 overflow-auto'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Job Board</h2>
            <p className='text-sm opacity-50 mt-1'>
              Submit a project → Oneshot builds it → Get your deliverable
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <span className={`badge badge-sm ${source === 'crm' || source === 'onchain+crm' ? 'badge-success' : 'badge-ghost'}`}>
              {source === 'crm' || source === 'onchain+crm' ? 'Live' : source === 'loading' ? 'Loading...' : source}
            </span>
            <span className='text-xs opacity-40 font-mono'>{jobs.length} jobs</span>
            <SubmitJob onSubmit={handleSubmit} demo={isDemo} />
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

      {isDemo && <AgentTerminal ref={terminalRef} />}
    </div>
  )
}
