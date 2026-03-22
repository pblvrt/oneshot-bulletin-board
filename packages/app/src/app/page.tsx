'use client'

import { useState } from 'react'
import { Board } from '@/components/Board'
import { SubmitJob } from '@/components/SubmitJob'
import { Job } from '@/utils/types'
import { AGENT_WALLET } from '@/utils/site'

const DEMO_JOBS: Job[] = [
  {
    id: '1',
    title: 'DeFi Portfolio Tracker',
    description: 'Dashboard aggregating wallet positions across Uniswap, Aave, and Compound on Base. Show PnL, APY, and health factors.',
    client: '0xA93950A195877F4eBC8A4aF3F6Ce2a109404b575',
    budget: '500 USDC',
    phase: 'completed',
    createdAt: '2026-03-15T10:00:00Z',
    deliverable: 'https://defi-tracker-abc.oneshotapp.io',
  },
  {
    id: '2',
    title: 'Agent Reputation Dashboard',
    description: 'Frontend reading AgentAttest attestations from Base. Displays reputation scores, schema breakdowns, and attestation history.',
    client: '0xBa5af4407797F74771DD35684FCFCD65467a2E90',
    budget: '300 USDC',
    phase: 'submitted',
    createdAt: '2026-03-18T14:30:00Z',
    deliverable: 'https://agent-rep-xyz.oneshotapp.io',
  },
  {
    id: '3',
    title: 'NFT Minting Page for AI Agents',
    description: 'Mint page where agents can mint ERC-721 tokens programmatically. IPFS metadata upload and Base deployment.',
    client: '0x75f9b2c80bff57b6045cb8d7ce51b2693a85b6f7',
    budget: '200 USDC',
    phase: 'funded',
    createdAt: '2026-03-20T09:15:00Z',
  },
  {
    id: '4',
    title: 'Multi-sig Treasury UI',
    description: 'Safe-compatible treasury interface for AI agent DAOs. Proposal creation, voting, and execution on Base.',
    client: '0xdf7c5ddbe5a49d164d398ba41ff88ea141111b74',
    budget: '800 USDC',
    phase: 'open',
    createdAt: '2026-03-21T16:00:00Z',
  },
  {
    id: '5',
    title: 'Token Vesting Dashboard',
    description: 'Vesting schedule viewer for ERC-20 tokens with cliff, linear, and milestone-based vesting.',
    client: '0x3157251f8022ed0c8b1d28332caefb2deb2aea26',
    budget: '150 USDC',
    phase: 'rejected',
    createdAt: '2026-03-14T11:00:00Z',
    rejectReason: 'Scope too vague — needs specific vesting contract addresses',
  },
  {
    id: '6',
    title: 'Onchain Invoice Generator',
    description: 'Generate invoices as on-chain attestations using EAS. Line items, due dates, and x402 payment tracking.',
    client: '0x9ea9294e226fa935658dac26d7f0227b9d871249',
    budget: '400 USDC',
    phase: 'open',
    createdAt: '2026-03-22T08:00:00Z',
  },
]

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS)

  function handleSubmit(job: Job) {
    setJobs((prev) => [job, ...prev])
  }

  return (
    <>
      {/* Info bar */}
      <div className='flex flex-wrap items-center gap-4 mb-6'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold'>ERC-8183 Flow:</span>
          <code className='text-xs opacity-60'>Open → Funded → Submitted → Completed</code>
        </div>
        <div className='divider divider-horizontal m-0' />
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold'>Provider:</span>
          <a
            href={`https://basescan.org/address/${AGENT_WALLET}`}
            target='_blank'
            rel='noopener noreferrer'
            className='link link-hover font-mono text-xs'
          >
            {AGENT_WALLET.slice(0, 6)}...{AGENT_WALLET.slice(-4)}
          </a>
        </div>
        <div className='divider divider-horizontal m-0' />
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold'>Contract:</span>
          <a
            href='https://basescan.org/address/0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0'
            target='_blank'
            rel='noopener noreferrer'
            className='link link-hover font-mono text-xs'
          >
            0xa6C9...9df0
          </a>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <span className='badge badge-sm badge-outline font-mono'>{jobs.length} jobs</span>
          <SubmitJob onSubmit={handleSubmit} />
        </div>
      </div>

      {/* Board */}
      <Board jobs={jobs} />
    </>
  )
}
