'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { base } from 'viem/chains'
import { Job } from '@/utils/types'

const ACP_ADDRESS = '0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0' as const
const ONESHOT_WALLET = '0x05D648fD33a050F3f28Eb91399F3Bbe9452735A3' as const
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const ZERO = '0x0000000000000000000000000000000000000000' as const

const ACP_ABI = [
  {
    name: 'createJob',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'expiredAt', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'budget', type: 'uint256' },
      { name: 'metadata', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export function SubmitJob({ onSubmit }: { onSubmit: (job: Job) => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const isWrongChain = isConnected && chainId !== base.id

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !isConnected) return

    if (isWrongChain) {
      switchChain({ chainId: base.id })
      return
    }

    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60)
    const budgetWei = budget ? BigInt(Math.floor(parseFloat(budget) * 1e6)) : 0n // USDC has 6 decimals
    const metadata = JSON.stringify({ title, description })

    writeContract(
      {
        address: ACP_ADDRESS,
        abi: ACP_ABI,
        functionName: 'createJob',
        args: [ONESHOT_WALLET, ZERO, expiredAt, USDC_BASE, budgetWei, metadata],
        chain: base,
      },
      {
        onSuccess: (hash) => {
          const job: Job = {
            id: hash.slice(0, 10),
            title,
            description,
            client: address || '0x0',
            budget: budget ? `${budget} USDC` : 'TBD',
            phase: 'open',
            createdAt: new Date().toISOString(),
          }
          onSubmit(job)

          setTimeout(() => {
            setTitle('')
            setDescription('')
            setBudget('')
            const modal = document.getElementById('submit-modal') as HTMLDialogElement
            modal?.close()
          }, 2000)
        },
      }
    )
  }

  return (
    <>
      <button
        className='btn btn-primary btn-sm'
        onClick={() => {
          const modal = document.getElementById('submit-modal') as HTMLDialogElement
          modal?.showModal()
        }}
      >
        Submit a Job
      </button>

      <dialog id='submit-modal' className='modal'>
        <div className='modal-box'>
          <h3 className='font-bold text-lg mb-1'>Submit a job to Oneshot</h3>
          <p className='text-xs opacity-40 mb-4'>
            Creates an ERC-8183 job onchain on Base · Oneshot is the provider
          </p>

          {!isConnected && (
            <div className='alert alert-warning mb-4'>
              <span className='text-sm'>Connect your wallet to submit a job onchain.</span>
            </div>
          )}

          {isSuccess && txHash && (
            <div className='alert alert-success mb-4'>
              <span className='text-sm'>
                Job created!{' '}
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link'
                >
                  View on BaseScan →
                </a>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text text-sm'>Project Title</span>
              </label>
              <input
                type='text'
                className='input input-bordered input-sm'
                placeholder='DeFi Dashboard'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isPending || isConfirming}
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text text-sm'>Description</span>
              </label>
              <textarea
                className='textarea textarea-bordered textarea-sm'
                placeholder='Describe what you want Oneshot to build...'
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isPending || isConfirming}
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text text-sm'>Budget (USDC, optional)</span>
              </label>
              <input
                type='text'
                className='input input-bordered input-sm font-mono'
                placeholder='100'
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                disabled={isPending || isConfirming}
              />
            </div>

            {isConnected && (
              <div className='text-xs opacity-40'>
                From: <code>{address?.slice(0, 6)}...{address?.slice(-4)}</code> · Contract:{' '}
                <code>0xa6C9...9df0</code> · Chain: Base
              </div>
            )}

            <button type='submit' className='btn btn-primary btn-sm mt-2' disabled={!isConnected || isPending || isConfirming}>
              {isWrongChain ? (
                'Switch to Base'
              ) : isPending ? (
                <><span className='loading loading-spinner loading-xs' /> Confirm in wallet...</>
              ) : isConfirming ? (
                <><span className='loading loading-spinner loading-xs' /> Confirming onchain...</>
              ) : (
                'Create Job Onchain'
              )}
            </button>
          </form>

          <div className='modal-action'>
            <form method='dialog'>
              <button className='btn btn-ghost btn-sm'>Close</button>
            </form>
          </div>
        </div>
        <form method='dialog' className='modal-backdrop'>
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}
