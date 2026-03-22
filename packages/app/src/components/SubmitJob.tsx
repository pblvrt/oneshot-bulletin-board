'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { base } from 'viem/chains'
import { ACP_ABI, ACP_ADDRESS, ONESHOT_WALLET, ZERO_ADDRESS } from '@/utils/acp'
import { Job } from '@/utils/types'

export function SubmitJob({ onSubmit }: { onSubmit: (job: Job) => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [step, setStep] = useState<'form' | 'creating' | 'memo' | 'done'>('form')

  const { writeContract: createJob, data: createTxHash, isPending: isCreating } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: createTxHash,
  })

  const isWrongChain = chainId !== base.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !isConnected) return

    if (isWrongChain) {
      switchChain({ chainId: base.id })
      return
    }

    setStep('creating')

    // 7 day expiry
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60)

    createJob({
      address: ACP_ADDRESS,
      abi: ACP_ABI,
      functionName: 'createJob',
      args: [ONESHOT_WALLET, ZERO_ADDRESS, expiredAt],
      chain: base,
    }, {
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
        setStep('done')

        setTimeout(() => {
          setTitle('')
          setDescription('')
          setBudget('')
          setStep('form')
          const modal = document.getElementById('submit-modal') as HTMLDialogElement
          modal?.close()
        }, 3000)
      },
      onError: (err) => {
        console.error('createJob failed:', err)
        setStep('form')
      }
    })
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
            Creates an ERC-8183 job onchain on Base via the ACP contract
          </p>

          {!isConnected && (
            <div className='alert alert-warning mb-4'>
              <span className='text-sm'>Connect your wallet to submit a job onchain.</span>
            </div>
          )}

          {step === 'done' && (
            <div className='alert alert-success mb-4'>
              <span className='text-sm'>Job created onchain! Tx: {createTxHash?.slice(0, 16)}...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
            <div className='form-control'>
              <label className='label'><span className='label-text text-sm'>Project Title</span></label>
              <input
                type='text'
                className='input input-bordered input-sm'
                placeholder='DeFi Dashboard'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={step !== 'form'}
              />
            </div>

            <div className='form-control'>
              <label className='label'><span className='label-text text-sm'>Description</span></label>
              <textarea
                className='textarea textarea-bordered textarea-sm'
                placeholder='Describe what you want Oneshot to build...'
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={step !== 'form'}
              />
            </div>

            <div className='form-control'>
              <label className='label'><span className='label-text text-sm'>Budget (USDC, optional)</span></label>
              <input
                type='text'
                className='input input-bordered input-sm font-mono'
                placeholder='100'
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                disabled={step !== 'form'}
              />
            </div>

            {isConnected && (
              <div className='text-xs opacity-40 flex items-center gap-2'>
                <span>From: <code>{address?.slice(0, 6)}...{address?.slice(-4)}</code></span>
                <span>·</span>
                <span>To: <code>ACP Contract</code></span>
                <span>·</span>
                <span>Chain: Base</span>
              </div>
            )}

            <button
              type='submit'
              className='btn btn-primary btn-sm mt-2'
              disabled={!isConnected || step !== 'form'}
            >
              {isWrongChain
                ? 'Switch to Base'
                : isCreating || isConfirming
                  ? 'Confirm in wallet...'
                  : 'Create Job Onchain'}
            </button>
          </form>

          <div className='modal-action'>
            <form method='dialog'>
              <button className='btn btn-ghost btn-sm' onClick={() => setStep('form')}>Close</button>
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
