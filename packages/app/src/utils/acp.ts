export const ACP_ADDRESS = '0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0' as const
export const ONESHOT_WALLET = '0x05D648fD33a050F3f28Eb91399F3Bbe9452735A3' as const
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
export const USDC_DECIMALS = 6

export const ACP_ABI = [
  {
    name: 'createJob',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'provider', type: 'address' as const },
      { name: 'evaluator', type: 'address' as const },
      { name: 'expiredAt', type: 'uint256' as const },
      { name: 'paymentToken', type: 'address' as const },
      { name: 'budget', type: 'uint256' as const },
      { name: 'metadata', type: 'string' as const },
    ],
    outputs: [{ name: '', type: 'uint256' as const }],
  },
  {
    name: 'createMemo',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'jobId', type: 'uint256' as const },
      { name: 'content', type: 'string' as const },
      { name: 'memoType', type: 'uint8' as const },
      { name: 'isSecured', type: 'bool' as const },
      { name: 'nextPhase', type: 'uint8' as const },
    ],
    outputs: [],
  },
  {
    name: 'setBudgetWithPaymentToken',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'jobId', type: 'uint256' as const },
      { name: 'amount', type: 'uint256' as const },
      { name: 'paymentToken', type: 'address' as const },
    ],
    outputs: [],
  },
  {
    name: 'claimBudget',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [{ name: 'jobId', type: 'uint256' as const }],
    outputs: [],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'spender', type: 'address' as const },
      { name: 'amount', type: 'uint256' as const },
    ],
    outputs: [{ name: '', type: 'bool' as const }],
  },
  {
    name: 'allowance',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [
      { name: 'owner', type: 'address' as const },
      { name: 'spender', type: 'address' as const },
    ],
    outputs: [{ name: '', type: 'uint256' as const }],
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' as const }],
    outputs: [{ name: '', type: 'uint256' as const }],
  },
] as const
