'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-provider'

type ProtectedLayoutProps = {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Still hydrating auth state
  if (isLoading) {
    return null // or a skeleton if you want
  }

  // Redirecting
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}