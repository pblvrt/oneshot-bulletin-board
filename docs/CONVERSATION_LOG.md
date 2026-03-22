# Conversation Log — Oneshot Bulletin Board

## The Idea (2026-03-22)

**Human:** "I want to create a public CRM-like interface where people can submit projects to be built by the Oneshot agent. The CRM uses ERC-8183 as stages. Then we add Oneshot to ACP."

**Agent:** Analyzed the ERC-8183 spec (Virtuals ACP) and identified the job lifecycle: Open → Funded → Submitted → Completed → Rejected → Expired. Each phase maps to an onchain state transition via the ACP contract on Base.

## Architecture Decisions

### Why ERC-8183?
ERC-8183 defines a trustless job escrow between agents. It fits perfectly: a client (human) posts a job, a provider (Oneshot) accepts and delivers, and the contract enforces the lifecycle.

### Why Virtuals ACP?
Virtuals already deployed ERC-8183 on Base with gas sponsorship. No need to deploy our own contract.

### Why not direct contract calls for the agent?
The ACP contract uses Alchemy Modular Accounts (Account Abstraction). The provider-side operations (accept, deliver) must go through the smart account system. We use the `@virtuals-protocol/acp-node` SDK for these calls. Client-side operations (createJob) work from any EOA.

## Build Process

### Phase 1: CRM UI
Built a Next.js kanban board (forked from nexth) with 6 ERC-8183 columns. Added wallet connection via Reown/WalletConnect. Users connect wallet → fill form → sign `createJob` transaction → job appears on board.

### Phase 2: Virtuals ACP Integration
Registered Oneshot on Virtuals ACP as a provider agent. Created a smart wallet (`0x05D648...`), whitelisted the signer key (entity ID 2). Set up a requestor agent (`0x058327...`) for the buyer side.

**Key discovery:** `createJob` works from any EOA wallet, but provider actions (accept, deliver) require the Alchemy smart account SDK. Client and provider cannot be the same address.

### Phase 3: Onchain Lifecycle
Wired the API to execute real onchain transitions:
- `acceptJob()` → `createMemo(jobId, message, 0, false, 1)` via smart account
- `submitDeliverable()` → `createMemo(jobId, deliverableURL, 0, false, 3)` via smart account
- `approveDeliverable()` → `signMemo(memoId, true, reason)` via smart account

All transactions verified on BaseScan.

### Phase 4: Onchain Reading
Discovered that ACP events emit from 3 different contracts (proxy delegates to internal contracts). Built `read-chain.ts` to read `JobCreated`, `NewMemo`, and `PhaseUpdated` events from all three contracts via the Alchemy proxy RPC. The board merges onchain data with CRM API data.

### Phase 5: Oneshot Agent
Created `/oneshot-agent` with a polling loop that:
1. Reads open jobs from the board API
2. Accepts them (onchain)
3. Builds via Oneshot MCP (create → scope → spec → build → deploy)
4. Submits the deployed URL as deliverable (onchain)

## Challenges

1. **ACP SDK requires Alchemy smart accounts** — direct EOA calls work for createJob but not for provider actions. Solved by using the SDK's `handleOperation` with the smart account.

2. **Events emit from 3 different contracts** — the ACP proxy delegates to internal contracts. Had to discover the actual event sources from transaction receipts.

3. **Public RPCs rate-limit log queries** — switched to the Alchemy proxy RPC that the SDK uses internally.

4. **Client and provider can't be the same address** — needed a separate requestor agent for testing.

## Verified Onchain Transactions

| Action | Tx Hash |
|--------|---------|
| Create job (EOA) | `0x59ee085aab94d5fa067329897170dc2841540ad3a2b3c5e15190ab475556a8b5` |
| Create job (requestor) | `0x69c74c0eb0387f4d017a7adff241fa99622385de8570c3dbbf07da8d0edbf523` |
| Accept job | `0xcba8031be916e22e14d0d59e660df151ff1713685908da653549b3d4d97e01e8` |
| Submit deliverable | `0xa763669d967325138a5ac6c1e3ea5c675eae8e27b77d8ac3794d757a25cc8933` |
