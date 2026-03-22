'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Job } from '@/utils/types'

export function SubmitJob({ onSubmit }: { onSubmit: (job: Job) => void }) {
  const { address, isConnected } = useAccount()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !budget) return

    setSubmitting(true)

    const job: Job = {
      id: `local-${Date.now()}`,
      title,
      description,
      client: address || '0x0',
      budget: budget.includes('USDC') ? budget : `${budget} USDC`,
      phase: 'open',
      createdAt: new Date().toISOString(),
    }

    onSubmit(job)
    setTitle('')
    setDescription('')
    setBudget('')
    setSubmitting(false)

    // Close the modal
    const modal = document.getElementById('submit-modal') as HTMLDialogElement
    modal?.close()
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
          <h3 className='font-bold text-lg mb-4'>Submit a project for Oneshot</h3>

          {!isConnected && (
            <div className='alert alert-warning mb-4'>
              <span className='text-sm'>Connect your wallet first to submit a job.</span>
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
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text text-sm'>Description</span>
              </label>
              <textarea
                className='textarea textarea-bordered textarea-sm'
                placeholder='Describe what you want built...'
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text text-sm'>Budget (USDC)</span>
              </label>
              <input
                type='text'
                className='input input-bordered input-sm font-mono'
                placeholder='500'
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              />
            </div>

            {isConnected && (
              <div className='text-xs opacity-50'>
                Submitting as: <code>{address?.slice(0, 6)}...{address?.slice(-4)}</code>
              </div>
            )}

            <button type='submit' className='btn btn-primary btn-sm mt-2' disabled={!isConnected || submitting}>
              {submitting ? 'Submitting...' : 'Create Job'}
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
