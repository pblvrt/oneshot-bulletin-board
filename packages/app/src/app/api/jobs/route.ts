import { NextResponse } from 'next/server'
import { acceptJob, submitDeliverable, approveDeliverable, rejectJob, isAcpConfigured } from '@/lib/acp-server'

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

const jobs: StoredJob[] = []
let nextId = 1

export async function GET() {
  return NextResponse.json({
    jobs,
    source: isAcpConfigured() ? 'crm+acp' : 'crm',
    count: jobs.length,
    acpConfigured: isAcpConfigured(),
  })
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

  // Update onchain job ID if provided
  if (onchainJobId) job.onchainJobId = Number(onchainJobId)

  const acpReady = isAcpConfigured() && job.onchainJobId
  let onchainResult: { txnHash?: string; error?: string } = {}

  // Execute onchain transitions via ACP SDK
  if (phase && acpReady) {
    try {
      switch (phase) {
        case 'funded': {
          const result = await acceptJob(job.onchainJobId!)
          onchainResult = { txnHash: result.txnHash }
          job.onchainTxns.push(result.txnHash)
          console.log(`Job #${job.id} accepted onchain: ${result.txnHash}`)
          break
        }
        case 'submitted': {
          if (!deliverable) {
            return NextResponse.json({ error: 'deliverable URL required' }, { status: 400 })
          }
          const result = await submitDeliverable(job.onchainJobId!, deliverable)
          onchainResult = { txnHash: result.txnHash }
          job.onchainTxns.push(result.txnHash)
          console.log(`Job #${job.id} deliverable submitted onchain: ${result.txnHash}`)
          break
        }
        case 'completed': {
          if (memoId) {
            const result = await approveDeliverable(Number(memoId))
            onchainResult = { txnHash: result.txnHash }
            job.onchainTxns.push(result.txnHash)
            console.log(`Job #${job.id} approved onchain: ${result.txnHash}`)
          }
          break
        }
        case 'rejected': {
          if (memoId) {
            const result = await rejectJob(Number(memoId), rejectReason || 'Rejected')
            onchainResult = { txnHash: result.txnHash }
            job.onchainTxns.push(result.txnHash)
            console.log(`Job #${job.id} rejected onchain: ${result.txnHash}`)
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

  // Always update CRM state
  if (phase) job.phase = phase
  if (deliverable) job.deliverable = deliverable
  if (rejectReason) job.rejectReason = rejectReason

  return NextResponse.json({
    ...job,
    onchainResult,
  })
}
