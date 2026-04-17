'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '../icons/Logo'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '@/context/auth-provider'
import { AuthModal } from '../sections/auth/AuthModal'
import { ConfirmModal } from '../sections/auth/ConfirmModal'
import { useTheme } from '@/context/theme-provider'
import { useUI } from '@/context/ui-provider'
import { MenuIcon, Moon, Sun } from 'lucide-react'

export const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth()
    const { toggleSideMenu } = useUI()
    const { theme, setTheme } = useTheme()
    const [modalOpen, setModalOpen] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Toggle light/dark mode
    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('light')
        else setTheme('light') // default fallback
    }

    return (
        <>
            <header className="fixed top-0 left-0 w-full shadow-md z-50 bg-background">
                <div className="flex items-center justify-between px-6 py-6 gap-8 mx-auto">

                    <div className='flex gap-4 items-center justify-center'>
                        {/* Menu Toggle */}
                        <button
                            onClick={toggleSideMenu}
                            className="cursor-pointer p-2 rounded hover:bg-gray-800 hover:text-accent-foreground"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>

                        {/* Logo */}
                        <Link href="/">
                            <Logo className="w-24 md:w-24" />
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="flex-1 mx-8 max-w-md">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-4 relative">
                        {isAuthenticated && user ? (
                            <div className="relative" ref={menuRef}>
                                {/* Avatar + username */}
                                <button
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <Avatar
                                        src={user.profile_image_url}
                                        alt={user.username}
                                        username={user.username}
                                        size="md"
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-background border border-border border-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
                                        {/* Top: Avatar + username */}
                                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border border-gray-800">
                                            <Avatar
                                                src={user.profile_image_url}
                                                alt={user.username}
                                                username={user.username}
                                                size="md"
                                            />
                                            <p className="text-sm font-medium text-foreground">{user.username}</p>
                                        </div>
                                        <ul className="flex flex-col">
                                            <li>
                                                <Link
                                                    href="/dashboard"
                                                    className="block px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    Dashboard
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/settings"
                                                    className="block px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    Settings
                                                </Link>
                                            </li>
                                            <li className="px-4 py-2 border-t border-border border-gray-800">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {theme === 'dark' ? (
                                                            <Moon className="w-4 h-4 text-foreground" />
                                                        ) : (
                                                            <Sun className="w-4 h-4 text-foreground" />
                                                        )}
                                                        <span className="text-sm text-foreground">Theme</span>
                                                    </div>
                                                    <button
                                                        onClick={toggleTheme}
                                                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-600 hover:bg-gray-500"
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        setShowConfirm(true)
                                                        setMenuOpen(false)
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground border-t border-border border-gray-800"
                                                >
                                                    Logout
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={() => setModalOpen(true)}
                            >
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Modals */}
            <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
            <ConfirmModal
                isOpen={showConfirm}
                title="Log out?"
                description="You will need to log in again to access your account."
                confirmLabel="Log out"
                isDanger={true}
                onCancel={() => setShowConfirm(false)}
                onConfirm={() => {
                    logout()
                    setShowConfirm(false)
                }}
            />
        </>
    )
}
