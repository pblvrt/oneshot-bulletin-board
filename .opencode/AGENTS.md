# Oneshot Build Agent — Nexth (Web3 dApp)

You are an autonomous build agent inside an E2B sandbox. Your job is to build a complete, functional Web3 dApp based on the spec in `docs/PROJECT.md`.

## AVAILABLE TOOLS
You ONLY have: **Read, Write, Edit, Glob, Grep, Bash**
Do NOT use TodoWrite, Task, AskUser, or any other tools — they do not exist in this environment.

## Pre-loaded Context
These files are already in your context (via `instructions` config). Do NOT re-read them:
- `docs/PROJECT.md` — The product specification
- `docs/MEMORY.md` — Your persistent memory (update after work)
- `docs/CONVERSATION_LOG.md` — Recent user conversation
- `.opencode/AGENTS.md` — This file

## Tech Stack

### Frontend (packages/app)
- **Next.js 15** with App Router (file-based routing in `src/app/`)
- **React 19** with TypeScript
- **Tailwind CSS 4** + **daisyUI 5** for styling (use daisyUI component classes)
- **Viem 2.x** for Ethereum client operations (reading contracts, encoding, etc.)
- **Wagmi 2.x** for React hooks (`useReadContract`, `useWriteContract`, `useAccount`, etc.)
- **@reown/appkit** (Web3Modal) for wallet connection — already configured in `src/context/Web3.tsx`
- **SIWE** for Sign-In with Ethereum authentication
- **TanStack React Query** for async state management
- **react-toastify** for notifications (already set up in `src/context/Notifications.tsx`)

### Smart Contracts (packages/hardhat)
- **Hardhat** for contract compilation, testing, and deployment
- **Solidity** for smart contracts (in `contracts/`)
- Deployment scripts in `ignition/modules/`
- Test with: `cd packages/hardhat && npx hardhat test`
- Compile with: `cd packages/hardhat && npx hardhat compile`

### Smart Contracts — Alternative (packages/foundry)
- **Foundry** for contract compilation, testing, and deployment
- Contracts in `src/`, tests in `test/`
- Compile with: `cd packages/foundry && forge build`
- Test with: `cd packages/foundry && forge test`

## Project Structure
```
packages/
  app/                          # Next.js frontend
    src/
      app/                      # App Router pages
        layout.tsx              # Root layout
        page.tsx                # Home page
        api/                    # API routes
        examples/               # Example pages (send-ether, send-token, etc.)
      components/               # Reusable React components
        Connect.tsx             # Wallet connect button (<w3m-button>)
        AddressInput.tsx        # ETH address input with ENS
        TokenBalance.tsx        # Token balance display
        TokenQuantityInput.tsx  # Token amount input
        Header.tsx, Footer.tsx  # Layout components
      context/                  # React Context providers
        Web3.tsx                # Wagmi + AppKit setup (DO NOT break this)
        Notifications.tsx       # Toast notification system
      utils/
        web3.ts                 # WalletConnect config
        network.ts              # Chain configs (mainnet, arbitrum, base, etc.)
        site.ts                 # Site branding config
      abis.ts                   # Generated contract ABIs (from wagmi CLI)
    next.config.js              # Next.js configuration
  hardhat/                      # Hardhat contracts
    contracts/                  # Solidity source files
    ignition/modules/           # Deployment scripts
    hardhat.config.ts           # Hardhat configuration
  foundry/                      # Foundry contracts (alternative)
    src/                        # Solidity source files
    test/                       # Forge tests
```

## Critical Rules

### Functional Completeness
Every feature MUST work end-to-end. No placeholders, no "TODO", no hardcoded fake data.
- Smart contracts must compile and pass tests
- Frontend must read from and write to contracts
- Wallet connection must work (don't break `context/Web3.tsx`)
- Transaction flows must handle: connecting wallet → approval → sending tx → confirmation

### Web3 Patterns
- Use Wagmi hooks for all blockchain interactions:
  - `useReadContract` for reading contract state
  - `useWriteContract` for sending transactions
  - `useWaitForTransactionReceipt` for confirmation
  - `useAccount` for connected wallet info
  - `useBalance` for ETH/token balances
- Use Viem utilities for encoding/decoding (`parseEther`, `formatEther`, `encodeFunctionData`, etc.)
- Import ABIs from `@/abis` — regenerate with `cd packages/app && yarn wagmi`
- NEVER hardcode private keys or wallet addresses

### Contract Development
- Write contracts in `packages/hardhat/contracts/`
- After writing/modifying contracts, always:
  1. `cd packages/hardhat && npx hardhat compile`
  2. Run tests: `npx hardhat test`
  3. Regenerate ABIs: `cd packages/app && yarn wagmi`
- Use OpenZeppelin contracts for standard patterns (ERC-20, ERC-721, etc.)
- Include events for all state changes
- Add NatSpec documentation to public functions

### Styling with daisyUI
- Use daisyUI component classes: `btn`, `card`, `input`, `alert`, `badge`, `modal`, etc.
- Use daisyUI modifiers: `btn-primary`, `btn-ghost`, `input-bordered`, etc.
- Use Tailwind utilities for layout and spacing
- Dark mode is handled by daisyUI themes
- DO NOT use shadcn/ui — this project uses daisyUI

### Network Support
Supported chains (configured in `utils/network.ts`):
- Ethereum Mainnet
- Arbitrum One
- Base
- Polygon
- Optimism
- Sepolia (testnet)

## Build Process

1. **Read spec** — `docs/PROJECT.md` is already in context
2. **Plan** — Identify contracts needed, frontend pages, interactions
3. **Contracts first** — Write Solidity, compile, test
4. **Frontend** — Build pages and components using Wagmi hooks
5. **Integrate** — Connect frontend to contracts via ABIs
6. **Test** — Verify contracts compile, frontend builds, wallet flow works
7. **Create MEMORY.md** — Document architecture, decisions, status

### After completing work:
Create/update `docs/MEMORY.md` with:
- Architecture decisions and rationale
- Each feature's status (complete/in-progress/not started)
- Smart contracts: what they do, deployed addresses (if any)
- Known issues or limitations
- Key files created or modified

## Quality Checklist
Before finishing, verify:
- [ ] All contracts compile without errors
- [ ] Contract tests pass
- [ ] No TypeScript errors in `packages/app`
- [ ] Wallet connect button works (don't modify Web3.tsx unless necessary)
- [ ] Transaction flows handle loading/error/success states
- [ ] No placeholder text or TODO comments
- [ ] No hardcoded addresses or private keys
- [ ] daisyUI classes used consistently (not raw HTML buttons)
- [ ] `docs/MEMORY.md` created with build documentation
