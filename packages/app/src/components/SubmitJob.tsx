'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { base } from 'viem/chains'
import { parseUnits, formatUnits } from 'viem'
import { Job } from '@/utils/types'
import { ACP_ADDRESS, ONESHOT_WALLET, ZERO_ADDRESS, USDC_BASE, USDC_DECIMALS, ACP_ABI, ERC20_ABI } from '@/utils/acp'

const JOB_REGISTRY = '0x9c690c267f20c385f8a053f62bc8c7e2d4b83744' as const
const JOB_CREATED_TOPIC = '0x01f44c6fb50369375eaa1dd51c061b72050089ada4694f86e9a340f05b345806'

type Step = 'idle' | 'approve' | 'approve-confirming' | 'create' | 'create-confirming' | 'escrow' | 'escrow-confirming' | 'done'

interface Props {
  onSubmit: (job: Job) => void
  demo?: boolean
}

export function SubmitJob({ onSubmit, demo }: Props) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<bigint | null>(null)
  const [txHashes, setTxHashes] = useState<string[]>([])

  const budgetWei = budget ? parseUnits(budget, USDC_DECIMALS) : BigInt(0)
  const hasBudget = budgetWei > BigInt(0)

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_BASE, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, ACP_ADDRESS] : undefined,
    chainId: base.id, query: { enabled: !!address && !demo },
  })

  const { data: usdcBalance } = useReadContract({
    address: USDC_BASE, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id, query: { enabled: !!address && !demo },
  })

  const { writeContract, data: currentTxHash, reset: resetWrite } = useWriteContract()
  const { isSuccess: txConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash: currentTxHash })

  const isWrongChain = isConnected && chainId !== base.id
  const needsApproval = hasBudget && (allowance === undefined || allowance < budgetWei)
  const insufficientBalance = hasBudget && usdcBalance !== undefined && usdcBalance < budgetWei

  // Step machine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!txConfirmed || !receipt) return
    if (step === 'approve-confirming') { refetchAllowance(); setStep('create'); resetWrite(); return }
    if (step === 'create-confirming') {
      const log = receipt.logs.find((l) => l.address.toLowerCase() === JOB_REGISTRY.toLowerCase() && l.topics[0] === JOB_CREATED_TOPIC)
      if (log?.topics[1]) setJobId(BigInt(log.topics[1]))
      setStep(hasBudget ? 'escrow' : 'done'); resetWrite(); return
    }
    if (step === 'escrow-confirming') { setStep('done'); resetWrite(); return }
  }, [txConfirmed, receipt, step])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step === 'create') sendCreateJob()
    else if (step === 'escrow' && jobId !== null) sendSetBudget()
    else if (step === 'done') handleOnchainDone()
  }, [step, jobId])

  function sendApprove() {
    setStep('approve')
    writeContract(
      { address: USDC_BASE, abi: ERC20_ABI, functionName: 'approve', args: [ACP_ADDRESS, budgetWei], chain: base },
      { onSuccess: (h) => { setTxHashes((p) => [...p, h]); setStep('approve-confirming') }, onError: (e) => { setError(e.message.split('\n')[0]); setStep('idle') } }
    )
  }

  function sendCreateJob() {
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60)
    const metadata = JSON.stringify({ title, description })
    writeContract(
      { address: ACP_ADDRESS, abi: ACP_ABI, functionName: 'createJob', args: [ONESHOT_WALLET, ZERO_ADDRESS, expiredAt, USDC_BASE, budgetWei, metadata], chain: base },
      { onSuccess: (h) => { setTxHashes((p) => [...p, h]); setStep('create-confirming') }, onError: (e) => { setError(e.message.split('\n')[0]); setStep('idle') } }
    )
  }

  function sendSetBudget() {
    if (jobId === null) return
    writeContract(
      { address: ACP_ADDRESS, abi: ACP_ABI, functionName: 'setBudgetWithPaymentToken', args: [jobId, budgetWei, USDC_BASE], chain: base },
      { onSuccess: (h) => { setTxHashes((p) => [...p, h]); setStep('escrow-confirming') }, onError: (e) => { setError(e.message.split('\n')[0]); setStep('done') } }
    )
  }

  async function handleOnchainDone() {
    const onchainJobId = jobId !== null ? Number(jobId) : undefined
    try {
      await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, client: address, budget, txHash: txHashes[txHashes.length - 1], onchainJobId }),
      })
    } catch {}
    const job: Job = {
      id: onchainJobId?.toString() || txHashes[0]?.slice(0, 10) || 'new',
      title, description, client: address || '0x0',
      budget: budget ? `${budget} USDC` : 'TBD', phase: 'open', createdAt: new Date().toISOString(),
    }
    onSubmit(job)
    setTimeout(() => { resetForm(); closeModal() }, 2000)
  }

  function handleDemoSubmit() {
    const job: Job = {
      id: String(Date.now()).slice(-6), title, description,
      client: address || '0xA939...b575',
      budget: budget ? `${budget} USDC` : 'TBD', phase: 'open', createdAt: new Date().toISOString(),
    }
    onSubmit(job)
    resetForm()
    closeModal()
  }

  function resetForm() { setTitle(''); setDescription(''); setBudget(''); setStep('idle'); setError(null); setJobId(null); setTxHashes([]) }
  function closeModal() { (document.getElementById('submit-modal') as HTMLDialogElement)?.close() }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description) return

    if (demo) { handleDemoSubmit(); return }

    if (!isConnected) return
    if (isWrongChain) { switchChain({ chainId: base.id }); return }
    if (insufficientBalance) { setError(`Insufficient USDC. Balance: ${formatUnits(usdcBalance!, USDC_DECIMALS)} USDC`); return }

    setError(null); setTxHashes([]); setJobId(null)
    if (needsApproval) sendApprove()
    else setStep('create')
  }

  const isBusy = step !== 'idle' && step !== 'done'
  const totalSteps = hasBudget ? (needsApproval ? 3 : 2) : 1
  const currentStep = step === 'approve' || step === 'approve-confirming' ? 1
    : step === 'create' || step === 'create-confirming' ? (needsApproval ? 2 : 1)
    : step === 'escrow' || step === 'escrow-confirming' ? totalSteps : 0

  const stepLabel: Record<Step, string> = {
    idle: '', approve: 'Approve USDC...', 'approve-confirming': 'Confirming approval...',
    create: 'Creating job...', 'create-confirming': 'Confirming...',
    escrow: 'Escrowing USDC...', 'escrow-confirming': 'Confirming escrow...', done: 'Done!',
  }

  return (
    <>
      <button className='btn btn-primary btn-sm' onClick={() => (document.getElementById('submit-modal') as HTMLDialogElement)?.showModal()}>
        Submit a Job
      </button>

      <dialog id='submit-modal' className='modal modal-bottom sm:modal-middle'>
        <div className='modal-box bg-base-100 border border-base-content/10 shadow-2xl max-w-lg'>
          {/* Header */}
          <div className='flex items-center justify-between mb-5'>
            <div>
              <h3 className='text-lg font-bold'>New Job</h3>
              <p className='text-xs opacity-40 mt-0.5'>ERC-8183 · Base · USDC escrow</p>
            </div>
            <form method='dialog'>
              <button className='btn btn-ghost btn-sm btn-circle' disabled={isBusy}>✕</button>
            </form>
          </div>

          {/* Alerts */}
          {!demo && !isConnected && (
            <div className='alert alert-warning mb-4 text-sm'>Connect wallet to submit onchain</div>
          )}
          {step === 'done' && !error && (
            <div className='alert alert-success mb-4 text-sm'>Job created{hasBudget ? ' — USDC escrowed' : ''}</div>
          )}
          {error && <div className='alert alert-error mb-4 text-sm break-all'>{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-medium opacity-60 mb-1.5 block'>Project Title</label>
              <input
                type='text'
                className='input input-bordered w-full'
                placeholder='e.g. DeFi Yield Dashboard'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isBusy}
              />
            </div>

            <div>
              <label className='text-xs font-medium opacity-60 mb-1.5 block'>Description</label>
              <textarea
                className='textarea textarea-bordered w-full'
                placeholder='What should Oneshot build? Be specific about features, integrations, and design preferences...'
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isBusy}
              />
            </div>

            <div>
              <label className='text-xs font-medium opacity-60 mb-1.5 block'>Budget</label>
              <div className='relative'>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  className='input input-bordered w-full font-mono pr-16'
                  placeholder='100'
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={isBusy}
                />
                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-40 font-mono'>USDC</span>
              </div>
              {!demo && isConnected && usdcBalance !== undefined && (
                <p className='text-xs opacity-30 mt-1'>
                  Wallet balance: {formatUnits(usdcBalance, USDC_DECIMALS)} USDC
                </p>
              )}
            </div>

            {/* Transaction info */}
            <div className='bg-base-200/50 rounded-xl p-3 flex flex-col gap-1.5'>
              <div className='flex justify-between text-xs'>
                <span className='opacity-40'>From</span>
                <code className='opacity-60'>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0xA939...b575'}</code>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='opacity-40'>Chain</span>
                <span className='opacity-60'>Base</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='opacity-40'>Provider</span>
                <code className='opacity-60'>Oneshot (0x05D6...35A3)</code>
              </div>
              {budget && (
                <div className='flex justify-between text-xs'>
                  <span className='opacity-40'>Escrow</span>
                  <span className='text-emerald-400 font-mono font-medium'>{budget} USDC</span>
                </div>
              )}
            </div>

            {/* Step progress (onchain mode) */}
            {!demo && isBusy && (
              <div className='bg-base-200/50 rounded-xl p-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='loading loading-spinner loading-xs' />
                  <span className='text-sm'>{stepLabel[step]}</span>
                  <span className='text-xs opacity-30 ml-auto font-mono'>{currentStep}/{totalSteps}</span>
                </div>
                <progress className='progress progress-primary w-full h-1.5' value={currentStep} max={totalSteps} />
              </div>
            )}

            <button
              type='submit'
              className='btn btn-primary w-full mt-1'
              disabled={!demo && (!isConnected || isBusy || insufficientBalance)}
            >
              {!demo && isWrongChain ? 'Switch to Base'
                : !demo && insufficientBalance ? 'Insufficient USDC'
                : isBusy ? <><span className='loading loading-spinner loading-xs' /> Processing...</>
                : budget ? `Create Job & Escrow ${budget} USDC`
                : 'Create Job Onchain'}
            </button>
          </form>
        </div>
        <form method='dialog' className='modal-backdrop'><button disabled={isBusy}>close</button></form>
      </dialog>
    </>
  )
}
