import { NextResponse } from 'next/server'
import AcpClient, { AcpContractClientV2, AcpJobPhases, baseAcpConfigV2 } from '@virtuals-protocol/acp-node'

let acpClient: AcpClient | null = null

async function getClient(): Promise<AcpClient> {
  if (acpClient) return acpClient

  const contractClient = await AcpContractClientV2.build(
    process.env.ACP_WALLET_PRIVATE_KEY as `0x${string}`,
    parseInt(process.env.ACP_SESSION_ENTITY_KEY_ID!, 10),
    process.env.ACP_AGENT_WALLET_ADDRESS as `0x${string}`,
    baseAcpConfigV2
  )

  acpClient = new AcpClient({
    acpContractClient: contractClient,
    skipSocketConnection: true,
  })

  return acpClient
}

function mapPhase(phase: AcpJobPhases): string {
  switch (phase) {
    case AcpJobPhases.REQUEST: return 'open'
    case AcpJobPhases.NEGOTIATION: return 'open'
    case AcpJobPhases.TRANSACTION: return 'funded'
    case AcpJobPhases.EVALUATION: return 'submitted'
    case AcpJobPhases.COMPLETED: return 'completed'
    case AcpJobPhases.REJECTED: return 'rejected'
    case AcpJobPhases.EXPIRED: return 'expired'
    default: return 'open'
  }
}

export async function GET() {
  try {
    const client = await getClient()

    const [active, completed, cancelled] = await Promise.all([
      client.getActiveJobs(1, 50),
      client.getCompletedJobs(1, 50),
      client.getCancelledJobs(1, 50),
    ])

    const jobs = [...active, ...completed, ...cancelled].map((job) => ({
      id: String(job.id),
      title: job.name || `Job #${job.id}`,
      description: typeof job.requirement === 'string' ? job.requirement : JSON.stringify(job.requirement || ''),
      client: String(job.clientAddress || 'unknown'),
      budget: job.price ? `${job.price} USDC` : 'TBD',
      phase: mapPhase(job.phase),
      createdAt: new Date().toISOString(),
      deliverable: job.getDeliverable() ? String(job.getDeliverable()) : undefined,
      rejectReason: job.rejectionReason || undefined,
    }))

    return NextResponse.json({ jobs, source: 'acp' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('ACP fetch error:', msg)
    return NextResponse.json({ jobs: [], source: 'error', error: msg })
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, client, budget } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
    }

    const acpClient = await getClient()
    const ONESHOT_WALLET = process.env.ACP_AGENT_WALLET_ADDRESS!

    // Get Oneshot agent directly by wallet address
    const agent = await acpClient.getAgent(ONESHOT_WALLET)

    if (!agent || !agent.jobOfferings?.length) {
      // Fallback: use initiateJob directly on the client
      const jobId = await acpClient.initiateJob(
        ONESHOT_WALLET,
        `${title}: ${description}`,
        100, // default fare
        undefined, // no evaluator
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        title
      )

      return NextResponse.json({
        jobId,
        source: 'acp',
        message: 'Job created onchain via ERC-8183 ACP (direct)',
      })
    }

    const offering = agent.jobOfferings[0]

    // Create real onchain job via ACP offering
    const jobId = await offering.initiateJob(
      { prompt: `${title}: ${description}` },
      undefined,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )

    return NextResponse.json({
      jobId,
      source: 'acp',
      message: 'Job created onchain via ERC-8183 ACP',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('ACP job creation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
