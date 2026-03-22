import React from 'react'
import { LinkComponent } from './LinkComponent'
import { SITE_EMOJI, SITE_NAME } from '@/utils/site'
import { Connect } from './Connect'

export function Header() {
  return (
    <header className='navbar flex justify-between p-4 pt-0'>
      <LinkComponent href='/'>
        <h1 className='text-xl font-bold'>
          {SITE_EMOJI} {SITE_NAME}
          <span className='text-sm font-normal opacity-60 ml-2'>Bulletin Board</span>
        </h1>
      </LinkComponent>

      <div className='flex gap-2 items-center'>
        <a
          href='https://app.virtuals.io/acp/agents/w03dt4ug62iglyokv5hsf6tk'
          target='_blank'
          rel='noopener noreferrer'
          className='btn btn-ghost btn-sm text-xs'
        >
          ACP
        </a>
        <a
          href='https://basescan.org/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=35616'
          target='_blank'
          rel='noopener noreferrer'
          className='btn btn-ghost btn-sm text-xs'
        >
          ERC-8004
        </a>
        <Connect />
      </div>
    </header>
  )
}
