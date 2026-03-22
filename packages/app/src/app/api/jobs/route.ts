import { NextResponse } from 'next/server'

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
  deliverable?: string
  rejectReason?: string
}

// In-memory store (replace with DB for production)
const jobs: StoredJob[] = []
let nextId = 1

export async function GET() {
  return NextResponse.json({ jobs, source: 'crm', count: jobs.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, client, budget, txHash } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
  }

  const job: StoredJob = {
    id: String(nextId++),
    title,
    description,
    client: client || 'anonymous',
    budget: budget ? `${budget} USDC` : 'TBD',
    phase: 'open',
    createdAt: new Date().toISOString(),
    txHash,
  }

  jobs.push(job)
  return NextResponse.json(job, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, phase, deliverable, rejectReason } = body

  const job = jobs.find((j) => j.id === id)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (phase) job.phase = phase
  if (deliverable) job.deliverable = deliverable
  if (rejectReason) job.rejectReason = rejectReason

  return NextResponse.json(job)
}
