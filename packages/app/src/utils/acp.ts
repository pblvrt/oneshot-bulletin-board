export const ACP_ADDRESS = '0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0' as const
export const ONESHOT_WALLET = '0x05D648fD33a050F3f28Eb91399F3Bbe9452735A3' as const
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export const ACP_ABI = [
  {
    name: 'createJob',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'provider', type: 'address' as const },
      { name: 'evaluator', type: 'address' as const },
      { name: 'expiredAt', type: 'uint256' as const },
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
] as const
