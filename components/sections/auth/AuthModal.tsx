'use client'

import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { Logo, Modal } from '@/components'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [signupEmail, setSignupEmail] = useState<string | null>(null)

  const switchToLogin = () => {
    setSignupEmail(null)
    setActiveTab('login')
  }
  const switchToSignUp = () => {
    setSignupEmail(null)
    setActiveTab('signup')
  }

  const handleClose = () => {
    setSignupEmail(null)
    onClose()
  }

  const handleSignUpSuccess = (email: string) => {
    setSignupEmail(email)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col gap-6 w-full">
        {/* Header: Logo + Title */}
        <div className="flex flex-col items-center gap-2">
          <Logo className="w-16 h-16" />
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 border-b border-gray-200">
          <button
            onClick={switchToLogin}
            className={`px-4 py-2 font-medium ${
              activeTab === 'login'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500'
            }`}
          >
            Log In
          </button>
          <button
            onClick={switchToSignUp}
            className={`px-4 py-2 font-medium ${
              activeTab === 'signup'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        {activeTab === 'login' ? (
          <LoginForm onSuccess={handleClose} />
        ) : signupEmail ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to <span className="font-medium text-foreground">{signupEmail}</span>.
              Please check your inbox to verify your email before logging in.
            </p>
            <button
              onClick={switchToLogin}
              className="text-sm text-primary hover:underline self-start"
            >
              Back to Log In
            </button>
          </div>
        ) : (
          <SignUpForm onSuccess={handleSignUpSuccess} />
        )}
      </div>
    </Modal>
  )
}