import React from 'react'
import { LinkComponent } from './LinkComponent'
import { SITE_EMOJI, SITE_NAME } from '@/utils/site'
import { Connect } from './Connect'

export function Header() {
  return (
    <header className='navbar flex justify-between p-4 pt-0'>
      <LinkComponent href='/'>
        <h1 className='text-lg font-bold flex items-center gap-2'>
          {SITE_EMOJI} {SITE_NAME}
        </h1>
      </LinkComponent>

      <div className='flex gap-2 items-center text-xs'>
        <a
          href='https://app.virtuals.io/acp/agents/w03dt4ug62iglyokv5hsf6tk'
          target='_blank'
          rel='noopener noreferrer'
          className='opacity-40 hover:opacity-100 transition-opacity'
        >
          ACP
        </a>
        <span className='opacity-20'>·</span>
        <a
          href='https://basescan.org/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=35616'
          target='_blank'
          rel='noopener noreferrer'
          className='opacity-40 hover:opacity-100 transition-opacity'
        >
          ERC-8004 #35616
        </a>
        <span className='opacity-20'>·</span>
        <a
          href='https://basescan.org/address/0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0'
          target='_blank'
          rel='noopener noreferrer'
          className='opacity-40 hover:opacity-100 transition-opacity font-mono'
        >
          ERC-8183
        </a>
        <Connect />
      </div>
    </header>
  )
}
