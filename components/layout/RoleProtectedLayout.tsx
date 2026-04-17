'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-provider'

type RoleProtectedLayoutProps = {
  children: React.ReactNode
  requiredRole: string
}

export function RoleProtectedLayout({
  children,
  requiredRole,
}: RoleProtectedLayoutProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (!user?.roles.includes(requiredRole)) {
      router.replace('/forbidden')
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router])

  if (isLoading || !isAuthenticated) return null

  if (!user?.roles.includes(requiredRole)) return null

  return <>{children}</>
}