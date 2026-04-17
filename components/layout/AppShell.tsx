'use client'

import { ReactNode } from 'react'
import { useUI } from '@/context/ui-provider'
import { Header } from './Header'
import { StreamSidebar } from '@/components'
import { cn } from '@/utils/cn'

type AppShellProps = {
  children: ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isSideMenuOpen } = useUI()

  return (
    <>
      <Header />

      {/* App shell */}
      <div className="flex pt-20">
        <StreamSidebar />

        <main
          className={cn(
            'flex-1 px-4 transition-[padding] duration-300',
            isSideMenuOpen ? 'pl-72' : 'pl-4'
          )}
        >
          {children}
        </main>
      </div>
    </>
  )
}
