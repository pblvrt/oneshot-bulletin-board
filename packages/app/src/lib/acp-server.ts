import AcpClient, { AcpContractClientV2, baseAcpConfigV2 } from '@virtuals-protocol/acp-node'

let acpClient: { contractClient: AcpContractClientV2; client: AcpClient } | null = null

export async function getAcpClients() {
  if (acpClient) return acpClient

  const key = process.env.ACP_WALLET_PRIVATE_KEY
  const entityId = process.env.ACP_SESSION_ENTITY_KEY_ID
  const wallet = process.env.ACP_AGENT_WALLET_ADDRESS

  if (!key || !entityId || !wallet) {
    throw new Error('ACP env vars not set')
  }

  const contractClient = await AcpContractClientV2.build(
    key as `0x${string}`,
    parseInt(entityId, 10),
    wallet as `0x${string}`,
    baseAcpConfigV2
  )

  const client = new AcpClient({
    acpContractClient: contractClient,
    skipSocketConnection: true,
  })

  acpClient = { contractClient, client }
  return acpClient
}

// ERC-8183 phase transitions via ACP contract
// Phase constants: 0=REQUEST, 1=NEGOTIATION, 2=TRANSACTION, 3=EVALUATION, 4=COMPLETED, 5=REJECTED

/**
 * Provider accepts a job — moves from REQUEST to NEGOTIATION
 * createMemo(jobId, content, memoType=0 MESSAGE, isSecured=false, nextPhase=1 NEGOTIATION)
 */
export async function acceptJob(jobId: number, message: string) {
  const { contractClient } = await getAcpClients()
  const payload = contractClient.createMemo(jobId, message, 0, false, 1)
  const result = await contractClient.handleOperation([payload])
  return result
}

/**
 * Provider submits deliverable — moves from TRANSACTION to EVALUATION
 * createMemo(jobId, deliverableURL, memoType=0, isSecured=false, nextPhase=3 EVALUATION)
 */
export async function submitDeliverable(jobId: number, deliverableUrl: string) {
  const { contractClient } = await getAcpClients()
  const payload = contractClient.createMemo(jobId, deliverableUrl, 0, false, 3)
  const result = await contractClient.handleOperation([payload])
  return result
}

/**
 * Evaluator/client approves deliverable — moves from EVALUATION to COMPLETED
 * signMemo(memoId, isApproved=true, reason)
 */
export async function approveDeliverable(memoId: number, reason: string) {
  const { contractClient } = await getAcpClients()
  const payload = contractClient.signMemo(memoId, true, reason)
  const result = await contractClient.handleOperation([payload])
  return result
}

/**
 * Reject a job — moves to REJECTED
 * signMemo(memoId, isApproved=false, reason)
 */
export async function rejectJob(memoId: number, reason: string) {
  const { contractClient } = await getAcpClients()
  const payload = contractClient.signMemo(memoId, false, reason)
  const result = await contractClient.handleOperation([payload])
  return result
}
