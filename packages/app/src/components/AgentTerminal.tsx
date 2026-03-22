'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warn' | 'error' | 'dim'
  message: string
}

export interface TerminalHandle {
  addLog: (entry: Omit<LogEntry, 'timestamp'>) => void
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info: 'text-sky-400',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  dim: 'text-zinc-600',
}

function ts(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60_000)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getInitialLog(): LogEntry[] {
  return [
    { timestamp: ts(310), level: 'dim', message: '$ oneshot-agent --watch --chain base' },
    { timestamp: ts(309), level: 'info', message: 'Wallet 0x05D6...35A3 · ERC-8004 #35616' },
    { timestamp: ts(308), level: 'info', message: 'Polling ACP 0xa6C9...9df0' },
    { timestamp: ts(308), level: 'dim', message: '─────────────────────────────' },

    { timestamp: ts(305), level: 'info', message: '📥 Job #1028 "Farcaster Frame Builder"' },
    { timestamp: ts(304), level: 'success', message: '✓ Accepted · 175 USDC escrowed' },
    { timestamp: ts(293), level: 'info', message: '  start_build() → 12 components' },
    { timestamp: ts(280), level: 'success', message: '  ✓ Tests 14/14 · deployed' },
    { timestamp: ts(275), level: 'success', message: '  ✓ Approved · 175 USDC released' },
    { timestamp: ts(275), level: 'dim', message: '─────────────────────────────' },

    { timestamp: ts(190), level: 'info', message: '📥 Job #1031 "Event RSVP dApp"' },
    { timestamp: ts(189), level: 'success', message: '✓ Accepted · 90 USDC escrowed' },
    { timestamp: ts(175), level: 'info', message: '  Building 8 components, 2 contracts' },
    { timestamp: ts(165), level: 'success', message: '  ✓ Approved · 90 USDC released' },
    { timestamp: ts(165), level: 'dim', message: '─────────────────────────────' },

    { timestamp: ts(125), level: 'info', message: '📥 Job #1035 "Portfolio Tracker"' },
    { timestamp: ts(124), level: 'success', message: '✓ Accepted · 120 USDC escrowed' },
    { timestamp: ts(95), level: 'success', message: '  ✓ Tests 11/11 · deployed' },
    { timestamp: ts(90), level: 'warn', message: '  ⏳ Awaiting approval...' },
    { timestamp: ts(90), level: 'dim', message: '─────────────────────────────' },

    { timestamp: ts(48), level: 'info', message: '📥 Job #1039 "DeFi Yield Calc"' },
    { timestamp: ts(47), level: 'success', message: '✓ Accepted · 100 USDC escrowed' },
    { timestamp: ts(35), level: 'info', message: '  Pulling protocol ABIs...' },
    { timestamp: ts(25), level: 'dim', message: '  ░░░░░░░░░░░░░ building...' },

    { timestamp: ts(32), level: 'info', message: '📥 Job #1040 "Token-Gated Blog"' },
    { timestamp: ts(31), level: 'success', message: '✓ Accepted · 75 USDC escrowed' },
    { timestamp: ts(22), level: 'info', message: '  start_build() → 6 components' },
    { timestamp: ts(12), level: 'dim', message: '  ░░░░░░░░░░░░░ building...' },
    { timestamp: ts(5), level: 'dim', message: '─────────────────────────────' },
    { timestamp: ts(1), level: 'info', message: 'Waiting for new jobs...' },
  ]
}

export const AgentTerminal = forwardRef<TerminalHandle>(function AgentTerminal(_, ref) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Show agent idle on startup
    setLogs([
      { timestamp: now(), level: 'dim' as const, message: '$ oneshot-agent --watch --chain base' },
      { timestamp: now(), level: 'info' as const, message: 'Wallet 0x05D6...35A3 · ERC-8004 #35616' },
      { timestamp: now(), level: 'info' as const, message: 'Polling ACP 0xa6C9...9df0' },
      { timestamp: now(), level: 'dim' as const, message: '─────────────────────────────' },
      { timestamp: now(), level: 'info' as const, message: 'Waiting for new jobs...' },
    ])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  useImperativeHandle(ref, () => ({
    addLog: (entry) => {
      setLogs((prev) => [...prev, { ...entry, timestamp: now() }])
    },
  }))

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className='fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-zinc-800 rounded-lg font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors z-50 shadow-xl'
      >
        <span className='text-emerald-400 animate-pulse text-[8px]'>●</span>
        oneshot-agent
      </button>
    )
  }

  return (
    <div className='h-[200px] flex-shrink-0 flex flex-col bg-[#0d1117] border-t border-zinc-800/50'>
      <div className='flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-zinc-800/50'>
        <div className='flex items-center gap-2'>
          <div className='flex gap-1'>
            <button onClick={() => setCollapsed(true)} className='w-2.5 h-2.5 rounded-full bg-[#f85149] hover:brightness-125 transition' />
            <div className='w-2.5 h-2.5 rounded-full bg-[#d29922]' />
            <div className='w-2.5 h-2.5 rounded-full bg-[#3fb950]' />
          </div>
          <span className='text-[11px] text-zinc-500 font-mono ml-1'>oneshot-agent</span>
        </div>
        <div className='flex items-center gap-1'>
          <span className='text-emerald-400 text-[8px] animate-pulse'>●</span>
          <span className='text-[10px] text-zinc-600 font-mono'>live</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className='flex-1 overflow-y-auto p-2.5 font-mono text-[11px] leading-[1.6] select-text'
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a #0d1117' }}
      >
        {logs.map((log, i) => (
          <div key={i} className='flex gap-1.5 whitespace-nowrap'>
            <span className='text-zinc-700 flex-shrink-0 select-none'>{log.timestamp}</span>
            <span className={`${LEVEL_COLORS[log.level]} truncate`}>{log.message}</span>
          </div>
        ))}
        <div className='flex gap-1.5 mt-0.5'>
          <span className='text-zinc-700 select-none'>{'        '}</span>
          <span className='text-zinc-600 animate-pulse'>▋</span>
        </div>
      </div>
    </div>
  )
})
