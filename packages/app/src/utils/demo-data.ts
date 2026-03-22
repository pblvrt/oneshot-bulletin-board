import { Job } from './types'
import { Notification } from './types'

const DEMO_CLIENTS: Record<string, string> = {
  alice: '0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12',
  bob: '0x9876543210FeDcBa0987654321fEdCbA98765432',
  carol: '0xAaBbCcDdEeFf00112233445566778899AaBbCcDd',
  dave: '0x5F3c7A2B8D1E9F4C6A0B7D2E8F1C3A5B9D4E6F7A',
}

const ONESHOT_WALLET = '0x05D648fD33a050F3f28Eb91399F3Bbe9452735A3'

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

export const DEMO_JOBS: Job[] = [
  // OPEN — just submitted
  {
    id: '1042',
    title: 'NFT Minting Page',
    description: 'Landing page with wallet connect, live mint counter, and allowlist checker for a 10k PFP collection on Base.',
    client: DEMO_CLIENTS.carol,
    budget: '150 USDC',
    phase: 'open',
    createdAt: minutesAgo(3),
  },
  {
    id: '1043',
    title: 'DAO Treasury Dashboard',
    description: 'Real-time dashboard showing token balances, recent transactions, and voting power distribution for a Gnosis Safe multisig.',
    client: DEMO_CLIENTS.dave,
    budget: '200 USDC',
    phase: 'open',
    createdAt: minutesAgo(1),
  },

  // FUNDED — accepted by Oneshot, USDC escrowed
  {
    id: '1039',
    title: 'DeFi Yield Calculator',
    description: 'Interactive tool to compare APY across Aave, Compound, and Morpho on Base. Show impermanent loss simulations and gas cost estimates.',
    client: DEMO_CLIENTS.alice,
    budget: '100 USDC',
    phase: 'funded',
    createdAt: minutesAgo(45),
  },
  {
    id: '1040',
    title: 'Token-Gated Blog',
    description: 'Next.js blog where posts are gated by ERC-721 ownership. Wallet connect → verify ownership → unlock content. Dark mode, markdown support.',
    client: DEMO_CLIENTS.bob,
    budget: '75 USDC',
    phase: 'funded',
    createdAt: minutesAgo(30),
  },

  // SUBMITTED — deliverable URL ready for review
  {
    id: '1035',
    title: 'Onchain Portfolio Tracker',
    description: 'Portfolio tracker that reads ERC-20 balances from connected wallet, shows PnL charts using CoinGecko prices, and supports Base + Ethereum.',
    client: DEMO_CLIENTS.bob,
    budget: '120 USDC',
    phase: 'submitted',
    createdAt: minutesAgo(120),
    deliverable: 'https://portfolio-tracker.oneshotapp.io',
  },

  // COMPLETED — approved, USDC released
  {
    id: '1031',
    title: 'Event RSVP dApp',
    description: 'Onchain RSVP system — users stake ETH to confirm attendance, get it back if they show up. Admin dashboard with QR check-in.',
    client: DEMO_CLIENTS.alice,
    budget: '90 USDC',
    phase: 'completed',
    createdAt: minutesAgo(180),
    deliverable: 'https://event-rsvp.oneshotapp.io',
  },
  {
    id: '1028',
    title: 'Farcaster Frame Builder',
    description: 'Visual builder for Farcaster Frames — drag and drop UI, preview in-feed, export to deployable Next.js endpoint. Supports buttons, text inputs, and images.',
    client: DEMO_CLIENTS.carol,
    budget: '175 USDC',
    phase: 'completed',
    createdAt: minutesAgo(300),
    deliverable: 'https://frame-builder.oneshotapp.io',
  },
]

export function getDemoNotifications(): Notification[] {
  return [
    {
      type: 'info',
      message: 'New job submitted: "DAO Treasury Dashboard" — 200 USDC escrowed',
      timestamp: Date.now() - 1 * 60_000,
      from: DEMO_CLIENTS.dave,
      href: 'https://basescan.org/tx/0xdemo1',
    },
    {
      type: 'info',
      message: 'New job submitted: "NFT Minting Page" — 150 USDC escrowed',
      timestamp: Date.now() - 3 * 60_000,
      from: DEMO_CLIENTS.carol,
      href: 'https://basescan.org/tx/0xdemo2',
    },
    {
      type: 'success',
      message: 'Oneshot accepted "DeFi Yield Calculator" — building now',
      timestamp: Date.now() - 40 * 60_000,
      from: ONESHOT_WALLET,
    },
    {
      type: 'success',
      message: 'Oneshot accepted "Token-Gated Blog" — building now',
      timestamp: Date.now() - 28 * 60_000,
      from: ONESHOT_WALLET,
    },
    {
      type: 'warning',
      message: 'Deliverable submitted for "Onchain Portfolio Tracker" → portfolio-tracker.oneshotapp.io',
      timestamp: Date.now() - 90 * 60_000,
      from: ONESHOT_WALLET,
      href: 'https://portfolio-tracker.oneshotapp.io',
    },
    {
      type: 'success',
      message: '"Event RSVP dApp" approved — 90 USDC released to Oneshot',
      timestamp: Date.now() - 170 * 60_000,
      from: DEMO_CLIENTS.alice,
      href: 'https://basescan.org/tx/0xdemo5',
    },
    {
      type: 'success',
      message: '"Farcaster Frame Builder" approved — 175 USDC released to Oneshot',
      timestamp: Date.now() - 290 * 60_000,
      from: DEMO_CLIENTS.carol,
      href: 'https://basescan.org/tx/0xdemo6',
    },
  ]
}
