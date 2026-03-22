import { NextResponse } from 'next/server'
import { acceptJob, submitDeliverable, approveDeliverable, rejectJob, claimBudget, isAcpConfigured } from '@/lib/acp-server'
import { readOnchainJobs } from '@/lib/read-chain'

type JobPhase = 'open' | 'funded' | 'submitted' | 'completed' | 'rejected' | 'expired'

interface StoredJob {
  id: string
  title: string
  description: string
  client: string
  budget: string
  phase: JobPhase
  createdAt: string
  txHash?: string
  onchainJobId?: number
  deliverable?: string
  rejectReason?: string
  onchainTxns: string[]
}

// In-memory CRM store
const crmJobs: StoredJob[] = []
let nextId = 1

// Cache onchain results in memory (survives requests, not restarts)
let onchainCache: StoredJob[] | null = null
let onchainCacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function GET() {
  // Read onchain jobs (cached)
  let onchainJobs: StoredJob[] = []
  let onchainError: string | undefined

  if (onchainCache && Date.now() - onchainCacheTime < CACHE_TTL) {
    onchainJobs = onchainCache
  } else {
    try {
      const raw = await readOnchainJobs()
      onchainJobs = raw.map((j) => ({
        ...j,
        phase: j.phase as JobPhase,
        onchainJobId: j.onchainJobId,
        onchainTxns: [j.txHash],
      }))
      onchainCache = onchainJobs
      onchainCacheTime = Date.now()
    } catch (e: unknown) {
      onchainError = e instanceof Error ? e.message : String(e)
      console.error('Onchain read failed:', onchainError)
      if (onchainCache) onchainJobs = onchainCache // use stale cache on error
    }
  }

  // Merge: CRM jobs override onchain jobs by onchainJobId (CRM has richer data)
  const merged = new Map<string, StoredJob>()

  // Add onchain jobs first
  for (const job of onchainJobs) {
    merged.set(job.id, job)
  }

  // Overlay CRM jobs
  for (const job of crmJobs) {
    if (job.onchainJobId) {
      const existing = merged.get(String(job.onchainJobId))
      if (existing) {
        // CRM data wins for title/description/deliverable, onchain wins for phase
        merged.set(String(job.onchainJobId), {
          ...existing,
          title: job.title || existing.title,
          description: job.description || existing.description,
          deliverable: job.deliverable || existing.deliverable,
          budget: job.budget || existing.budget,
          // Use the more advanced phase
          phase: phaseOrder(job.phase) > phaseOrder(existing.phase) ? job.phase : existing.phase,
          onchainTxns: [...new Set([...existing.onchainTxns, ...job.onchainTxns])],
        })
      } else {
        merged.set(job.id, job)
      }
    } else {
      merged.set(`crm-${job.id}`, job)
    }
  }

  const jobs = [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json({
    jobs,
    source: onchainJobs.length > 0 ? 'onchain+crm' : 'crm',
    count: jobs.length,
    onchainCount: onchainJobs.length,
    crmCount: crmJobs.length,
    onchainError,
  })
}

function phaseOrder(phase: JobPhase): number {
  const order: Record<JobPhase, number> = {
    open: 0, funded: 1, submitted: 2, completed: 3, rejected: 3, expired: 3,
  }
  return order[phase] || 0
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, client, budget, txHash, onchainJobId } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
  }

  const job: StoredJob = {
    id: String(nextId++),
    title,
    description,
    client: client || 'anonymous',
    budget: budget ? (String(budget).includes('USDC') ? budget : `${budget} USDC`) : 'TBD',
    phase: 'open',
    createdAt: new Date().toISOString(),
    txHash,
    onchainJobId: onchainJobId ? Number(onchainJobId) : undefined,
    onchainTxns: txHash ? [txHash] : [],
  }

  crmJobs.push(job)
  return NextResponse.json(job, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, phase, deliverable, rejectReason, onchainJobId, memoId } = body

  // Find in CRM or create a stub
  let job = crmJobs.find((j) => j.id === id || String(j.onchainJobId) === id)
  if (!job) {
    // Create a stub for onchain-only jobs
    job = {
      id: String(nextId++),
      title: `Job #${id}`,
      description: '',
      client: 'unknown',
      budget: 'TBD',
      phase: 'open',
      createdAt: new Date().toISOString(),
      onchainJobId: onchainJobId ? Number(onchainJobId) : Number(id) || undefined,
      onchainTxns: [],
    }
    crmJobs.push(job)
  }

  if (onchainJobId) job.onchainJobId = Number(onchainJobId)

  const acpReady = isAcpConfigured() && job.onchainJobId
  let onchainResult: { txnHash?: string; error?: string } = {}

  if (phase && acpReady) {
    try {
      switch (phase) {
        case 'funded': {
          const result = await acceptJob(job.onchainJobId!)
          onchainResult = { txnHash: result.txnHash }
          job.onchainTxns.push(result.txnHash)
          break
        }
        case 'submitted': {
          if (!deliverable) {
            return NextResponse.json({ error: 'deliverable URL required' }, { status: 400 })
          }
          const result = await submitDeliverable(job.onchainJobId!, deliverable)
          onchainResult = { txnHash: result.txnHash }
          job.onchainTxns.push(result.txnHash)
          break
        }
        case 'completed': {
          if (memoId) {
            const result = await approveDeliverable(Number(memoId))
            onchainResult = { txnHash: result.txnHash }
            job.onchainTxns.push(result.txnHash)
          }
          // Claim escrowed USDC for the provider
          if (job.onchainJobId) {
            try {
              const claimResult = await claimBudget(job.onchainJobId)
              job.onchainTxns.push(claimResult.txnHash)
            } catch (e: unknown) {
              console.error(`Budget claim failed for job #${job.onchainJobId}:`, e instanceof Error ? e.message : e)
              // Don't block completion if claim fails — can retry later
            }
          }
          break
        }
        case 'rejected': {
          if (memoId) {
            const result = await rejectJob(Number(memoId), rejectReason || 'Rejected')
            onchainResult = { txnHash: result.txnHash }
            job.onchainTxns.push(result.txnHash)
          }
          break
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`Onchain transition failed for job #${job.id}:`, msg)
      onchainResult = { error: msg }
    }
  }

  if (phase) job.phase = phase as JobPhase
  if (deliverable) job.deliverable = deliverable
  if (rejectReason) job.rejectReason = rejectReason

  return NextResponse.json({ ...job, onchainResult })
}
