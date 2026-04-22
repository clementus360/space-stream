'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { authApi } from '@/utils/api/auth'
import { CheckCircle, XCircle } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('Verifying your email...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setStatus('No token provided.')
      setLoading(false)
      return
    }

    authApi.verifyEmail(token)
      .then(res => setStatus(res.message))
      .catch(err => setStatus(err.message || 'Verification failed.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-lg">Verifying your email...</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-2xl shadow-lg p-10 flex flex-col items-center gap-6 max-w-lg w-full">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            {status.toLowerCase().includes('success') ? (
              <CheckCircle className="w-10 h-10 text-primary" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>

          <h1 className="text-3xl font-semibold text-foreground">
            {status.toLowerCase().includes('success') ? 'Email Verified!' : 'Verification Failed'}
          </h1>
          <p className="text-muted-foreground text-center">{status}</p>

          {status.toLowerCase().includes('success') && (
            <a
              href="/"
              className="mt-4 inline-block bg-primary text-primary-foreground font-medium py-2 px-6 rounded-full hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg">Verifying your email...</p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}