'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { Button, TextInput } from '@/components'

type LoginFormProps = {
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(username, password)
      onSuccess?.()
    } catch (err: any) {
        console.log("Login error: ", err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextInput
        name="username"
        label="Username"
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        errorMessage={error ? '' : undefined} // optional field-specific errors later
      />
      <TextInput
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        errorMessage={error ?? undefined}
      />
      <Button type="submit" variant="primary" size="md" disabled={loading} className='w-full mt-4'>
        {loading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  )
}