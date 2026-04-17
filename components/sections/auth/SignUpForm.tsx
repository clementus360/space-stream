'use client'

import { Button, TextInput } from '@/components'
import { useAuth } from '@/context/auth-provider'
import { useState } from 'react'

type SignUpFormProps = {
    onSuccess?: (email: string) => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
    const { register } = useAuth()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        console.log("Submitting registration with: ", { username, email, password })
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const result = await register(username, email, password)
            if (result.success) {
                onSuccess?.(email)
            } else {
                setError(result.message || 'Registration failed')
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed')
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
                errorMessage={error ? '' : undefined}
            />
            <TextInput
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                errorMessage={error ? '' : undefined}
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
                {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
        </form>
    )
}
