'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { authApi } from '@/utils/api/auth'
import { storageApi } from '@/utils/api/storage'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'

export default function SettingsPage() {
  const { user, refresh, apiCallWithRefresh } = useAuth()
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingProfile(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload to Supabase storage
      const publicUrl = await storageApi.uploadProfilePicture(user.user_id, file)

      // Update profile picture via API
      await apiCallWithRefresh((token) =>
        authApi.updateProfilePicture(token, { profile_image_url: publicUrl })
      )

      // Refresh user data to get updated profile picture
      await refresh()
      setSuccess('Profile picture updated successfully')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload profile picture'
      console.error('Error uploading profile picture:', err)
      setError(errorMsg)
    } finally {
      setIsUploadingProfile(false)
      // Reset the input
      e.target.value = ''
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground/60 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-background border border-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
            <p className="text-foreground/60 mt-1">Manage your profile picture and account details</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar
                src={user?.profile_image_url}
                alt={user?.username || 'User'}
                username={user?.username || 'U'}
                size="lg"
              />
              <div className="relative">
                <input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={isUploadingProfile}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploadingProfile}
                  onClick={() => document.getElementById('profile-picture-input')?.click()}
                >
                  {isUploadingProfile ? 'Uploading...' : 'Change Picture'}
                </Button>
              </div>
              <p className="text-xs text-foreground/60 text-center">
                Max 5MB. JPG, PNG, GIF
              </p>
            </div>

            {/* Account Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm text-foreground/60">Username</label>
                <p className="text-lg font-medium text-foreground mt-1">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm text-foreground/60">Email</label>
                <p className="text-lg font-medium text-foreground mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-foreground/60">Account Status</label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    user?.is_verified
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {user?.is_verified ? '✓ Verified' : '⚠ Unverified'}
                </span>
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div>
                  <label className="text-sm text-foreground/60">Roles</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-background border border-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-foreground/60 mb-2">User ID</p>
              <p className="text-foreground font-mono text-sm">{user?.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-2">Account Created</p>
              <p className="text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
