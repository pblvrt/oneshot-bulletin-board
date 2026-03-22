import { createPublicClient, http, decodeAbiParameters } from 'viem'
import { base } from 'viem/chains'

// Contracts that emit ACP events
const JOB_REGISTRY = '0x9c690c267f20c385f8a053f62bc8c7e2d4b83744' as const
const MEMO_LEDGER = '0x14dab2b846a4c07b3f52c37e3fd7265c2bcdf485' as const
const ACP_V2 = '0x9c6c5a7125934cc6a711a7bf44f3cdcccf91f30c' as const

// Event topics
const JOB_CREATED = '0x01f44c6fb50369375eaa1dd51c061b72050089ada4694f86e9a340f05b345806'
const NEW_MEMO = '0x6c0617cd4455d89abf57648dd5b27cf2ede8ea5020fb71bbd893fc3a5b60e8ae'
const PHASE_UPDATED = '0x0f675752d3292ec2e9a2eff49738c3af7ba92f81152c8b7e135dc443b3c67bcb'
const V2_MEMO = '0xbb0268ad77b327d7fa36e685275aba83e0e27e897cd7c86a1b851e9a09e4b4ea'

const ONESHOT_WALLET = '0x05D648fD33a050F3f28Eb91399F3Bbe9452735A3'.toLowerCase()

const PHASE_NAMES: Record<number, string> = {
  0: 'open', 1: 'open', 2: 'funded', 3: 'submitted',
  4: 'completed', 5: 'rejected', 6: 'expired',
}

const RPC_URL = 'https://alchemy-proxy-prod.virtuals.io/api/proxy/rpc'

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
})

export interface OnchainJob {
  id: string
  onchainJobId: number
  title: string
  description: string
  client: string
  budget: string
  phase: string
  createdAt: string
  txHash: string
  deliverable?: string
  memos: { content: string; sender: string; memoId: number }[]
}

export async function readOnchainJobs(): Promise<OnchainJob[]> {
  const current = await client.getBlockNumber()
  // ~5.5 hours of blocks (max safe range)
  const from = current - 2000n

  // 1. Get JobCreated events
  const jobLogs = await client.getLogs({
    address: JOB_REGISTRY,
    topics: [JOB_CREATED],
    fromBlock: from,
    toBlock: 'latest',
  })

  // Filter for Oneshot as provider
  const oneshotJobs: { jobId: number; client: string; memoId: number; block: number; tx: string }[] = []
  for (const log of jobLogs) {
    try {
      if (!log.data || log.data === '0x') continue
      const decoded = decodeAbiParameters(
        [{ type: 'address' }, { type: 'address' }, { type: 'uint256' }],
        log.data
      )
      if (decoded[0].toLowerCase() === ONESHOT_WALLET) {
        oneshotJobs.push({
          jobId: parseInt(log.topics[1]!, 16),
          memoId: parseInt(log.topics[2]!, 16),
          client: '0x' + log.topics[3]!.slice(26),
          block: Number(log.blockNumber),
          tx: log.transactionHash!,
        })
      }
    } catch {}
  }

  if (oneshotJobs.length === 0) return []

  // 2. Get memo content from memo ledger (creation memos)
  const memoLogs = await client.getLogs({
    address: MEMO_LEDGER,
    topics: [NEW_MEMO],
    fromBlock: from,
    toBlock: 'latest',
  })

  // 3. Get phase updates
  const phaseLogs = await client.getLogs({
    address: MEMO_LEDGER,
    topics: [PHASE_UPDATED],
    fromBlock: from,
    toBlock: 'latest',
  })

  // 4. Get V2 memo events (from SDK calls like accept/deliver)
  const v2MemoLogs = await client.getLogs({
    address: ACP_V2,
    topics: [V2_MEMO],
    fromBlock: from,
    toBlock: 'latest',
  })

  // Build job objects
  return oneshotJobs.map((job) => {
    // Find creation memo content (has job metadata)
    let title = `Job #${job.jobId}`
    let description = ''

    // Check memo ledger for initial memo
    for (const memo of memoLogs) {
      const memoMemoId = parseInt(memo.topics[1]!, 16)
      if (memoMemoId === job.memoId) {
        try {
          const decoded = decodeAbiParameters([{ type: 'string' }], memo.data)
          const content = decoded[0]
          try {
            const parsed = JSON.parse(content)
            if (parsed.title) title = parsed.title
            if (parsed.description) description = parsed.description
          } catch {
            description = content
          }
        } catch {}
        break
      }
    }

    // Find latest phase from phase events
    let latestPhase = 0
    for (const phase of phaseLogs) {
      const phaseJobMemoId = parseInt(phase.topics[1]!, 16)
      // Phase events use memoId in topics, need to match by checking the data
      if (phaseJobMemoId === job.memoId) {
        try {
          const decoded = decodeAbiParameters([{ type: 'uint8' }, { type: 'uint8' }], phase.data)
          latestPhase = Number(decoded[1])
        } catch {}
      }
    }

    // Check V2 memo events for accept/deliver actions
    const v2Memos: { content: string; sender: string; memoId: number }[] = []
    for (const v2 of v2MemoLogs) {
      try {
        const v2JobId = parseInt(v2.topics[2]!, 16)
        if (v2JobId === job.jobId) {
          const sender = '0x' + v2.topics[3]!.slice(26)
          v2Memos.push({
            memoId: parseInt(v2.topics[1]!, 16),
            sender,
            content: 'SDK memo',
          })
          // If Oneshot sent a memo after the creation, job is at least accepted
          if (sender.toLowerCase() === ONESHOT_WALLET && latestPhase < 1) {
            latestPhase = 1
          }
        }
      } catch {}
    }

    // Find deliverable from V2 memos
    let deliverable: string | undefined
    // If there are multiple SDK memos, the later ones likely contain deliverables
    if (v2Memos.length >= 2) {
      latestPhase = Math.max(latestPhase, 3) // At least EVALUATION
    }

    return {
      id: String(job.jobId),
      onchainJobId: job.jobId,
      title,
      description: description || 'Onchain job for Oneshot',
      client: job.client,
      budget: 'TBD',
      phase: PHASE_NAMES[latestPhase] || 'open',
      createdAt: new Date().toISOString(),
      txHash: job.tx,
      deliverable,
      memos: v2Memos,
    }
  })
}
