import { NextResponse } from 'next/server'
import { acceptJob, submitDeliverable, approveDeliverable, rejectJob } from '@/lib/acp-server'

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
  memoIds: number[]
}

// In-memory store
const jobs: StoredJob[] = []
let nextId = 1

export async function GET() {
  return NextResponse.json({ jobs, source: 'crm', count: jobs.length })
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
    budget: budget ? (budget.includes('USDC') ? budget : `${budget} USDC`) : 'TBD',
    phase: 'open',
    createdAt: new Date().toISOString(),
    txHash,
    onchainJobId: onchainJobId || undefined,
    memoIds: [],
  }

  jobs.push(job)
  return NextResponse.json(job, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, phase, deliverable, rejectReason, onchainJobId, memoId } = body

  const job = jobs.find((j) => j.id === id)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const jobIdOnchain = onchainJobId || job.onchainJobId
  let onchainResult = null

  // Execute onchain phase transitions
  if (phase && jobIdOnchain) {
    try {
      switch (phase) {
        case 'funded': {
          // Provider accepts the job → NEGOTIATION
          onchainResult = await acceptJob(jobIdOnchain, `Accepted: ${job.title}`)
          break
        }
        case 'submitted': {
          // Provider submits deliverable → EVALUATION
          if (!deliverable) {
            return NextResponse.json({ error: 'Deliverable URL required for submission' }, { status: 400 })
          }
          onchainResult = await submitDeliverable(jobIdOnchain, deliverable)
          break
        }
        case 'completed': {
          // Approve deliverable → COMPLETED
          if (!memoId) {
            return NextResponse.json({ error: 'memoId required to approve' }, { status: 400 })
          }
          onchainResult = await approveDeliverable(memoId, 'Deliverable approved')
          break
        }
        case 'rejected': {
          if (!memoId) {
            return NextResponse.json({ error: 'memoId required to reject' }, { status: 400 })
          }
          onchainResult = await rejectJob(memoId, rejectReason || 'Rejected')
          break
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Onchain transition failed:', msg)
      // Still update CRM state even if onchain fails
      onchainResult = { error: msg }
    }
  }

  // Update CRM state
  if (phase) job.phase = phase
  if (deliverable) job.deliverable = deliverable
  if (rejectReason) job.rejectReason = rejectReason
  if (onchainJobId) job.onchainJobId = onchainJobId

  return NextResponse.json({ ...job, onchainResult })
}
