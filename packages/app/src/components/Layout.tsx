import React, { PropsWithChildren } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout(props: PropsWithChildren) {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />

      <main className='grow px-6 max-w-[1600px] w-full mx-auto'>{props.children}</main>

      <Footer />
    </div>
  )
}
