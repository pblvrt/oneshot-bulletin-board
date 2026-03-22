import { AcpContractClientV2, baseAcpConfigV2 } from '@virtuals-protocol/acp-node'
import { encodeFunctionData } from 'viem'

let contractClient: AcpContractClientV2 | null = null

async function getContractClient(): Promise<AcpContractClientV2> {
  if (contractClient) return contractClient

  const key = process.env.ACP_WALLET_PRIVATE_KEY
  const entityId = process.env.ACP_SESSION_ENTITY_KEY_ID
  const wallet = process.env.ACP_AGENT_WALLET_ADDRESS

  if (!key || !entityId || !wallet) {
    throw new Error('ACP env vars not set: ACP_WALLET_PRIVATE_KEY, ACP_SESSION_ENTITY_KEY_ID, ACP_AGENT_WALLET_ADDRESS')
  }

  contractClient = await AcpContractClientV2.build(
    key as `0x${string}`,
    parseInt(entityId, 10),
    wallet as `0x${string}`,
    baseAcpConfigV2
  )

  return contractClient
}

/**
 * Provider accepts a job — creates memo advancing to NEGOTIATION (phase 1)
 */
export async function acceptJob(onchainJobId: number): Promise<{ userOpHash: string; txnHash: string }> {
  const client = await getContractClient()
  const payload = client.createMemo(onchainJobId, 'Job accepted by Oneshot agent', 0, false, 1)
  return await client.handleOperation([payload])
}

/**
 * Provider submits deliverable — creates memo advancing to EVALUATION (phase 3)
 */
export async function submitDeliverable(onchainJobId: number, deliverableUrl: string): Promise<{ userOpHash: string; txnHash: string }> {
  const client = await getContractClient()
  const payload = client.createMemo(
    onchainJobId,
    JSON.stringify({ deliverable: deliverableUrl }),
    0,
    false,
    3 // EVALUATION
  )
  return await client.handleOperation([payload])
}

/**
 * Approve deliverable — sign memo as approved, advancing to COMPLETED (phase 4)
 */
export async function approveDeliverable(memoId: number): Promise<{ userOpHash: string; txnHash: string }> {
  const client = await getContractClient()
  const payload = client.signMemo(memoId, true, 'Deliverable approved')
  return await client.handleOperation([payload])
}

/**
 * Reject — sign memo as rejected (phase 5)
 */
export async function rejectJob(memoId: number, reason: string): Promise<{ userOpHash: string; txnHash: string }> {
  const client = await getContractClient()
  const payload = client.signMemo(memoId, false, reason)
  return await client.handleOperation([payload])
}

/**
 * Provider claims escrowed USDC after job is completed (phase 4)
 */
export async function claimBudget(jobId: number): Promise<{ userOpHash: string; txnHash: string }> {
  const client = await getContractClient()

  const claimBudgetAbi = [{
    name: 'claimBudget',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [{ name: 'jobId', type: 'uint256' as const }],
    outputs: [],
  }] as const

  const data = encodeFunctionData({
    abi: claimBudgetAbi,
    functionName: 'claimBudget',
    args: [BigInt(jobId)],
  })

  const payload = {
    data,
    contractAddress: baseAcpConfigV2.contractAddress,
  }

  return await client.handleOperation([payload])
}

export function isAcpConfigured(): boolean {
  return !!(
    process.env.ACP_WALLET_PRIVATE_KEY &&
    process.env.ACP_SESSION_ENTITY_KEY_ID &&
    process.env.ACP_AGENT_WALLET_ADDRESS
  )
}
