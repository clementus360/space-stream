'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/context/auth-provider'
import { authApi } from '@/utils/api/auth'
import { streamApi } from '@/utils/api/stream'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { ConfirmModal } from '@/components/sections/auth/ConfirmModal'

export default function DashboardPage() {
  const { user, refresh, apiCallWithRefresh } = useAuth()
  const [streamKey, setStreamKey] = useState<string | null>(null)
  const [isLoadingKey, setIsLoadingKey] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSavingMetadata, setIsSavingMetadata] = useState(false)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataLoadError, setMetadataLoadError] = useState<string | null>(null)
  const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'stream-key' | 'metadata'>('stream-key')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isStreamer = user?.roles?.includes('streamer')

  // Fetch stream key if user is a streamer
  useEffect(() => {
    if (isStreamer && !streamKey) {
      fetchStreamKey()
    }
  }, [isStreamer])

  useEffect(() => {
    if (!user?.user_id) return
    const storageKey = `stream_metadata_${user.user_id}`
    const stored = localStorage.getItem(storageKey)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as { title?: string; description?: string }
      if (parsed.title && !title) setTitle(parsed.title)
      if (parsed.description && !description) setDescription(parsed.description)
    } catch {
      // ignore malformed storage
    }
  }, [user?.user_id])

  useEffect(() => {
    const loadMetadata = async () => {
      if (!isStreamer || !user?.username || activeTab !== 'metadata' || hasLoadedMetadata) return
      setIsLoadingMetadata(true)
      setMetadataLoadError(null)

      try {
        const stream = await streamApi.getStream(user.username)
        setTitle(stream.title || '')
        setDescription(stream.description || '')

        if (user?.user_id) {
          const storageKey = `stream_metadata_${user.user_id}`
          localStorage.setItem(
            storageKey,
            JSON.stringify({ title: stream.title || '', description: stream.description || '' })
          )
        }
      } catch (err: any) {
        // If stream is not live (404), just use local storage silently
        if (err.message?.includes('404')) {
          // Stream is offline, already loaded from localStorage
          return
        }
        const errorMsg = err.message || 'Unable to load stream metadata'
        setMetadataLoadError(errorMsg)
      } finally {
        setHasLoadedMetadata(true)
        setIsLoadingMetadata(false)
      }
    }

    loadMetadata()
  }, [activeTab, isStreamer, user?.username, hasLoadedMetadata])

  const fetchStreamKey = async () => {
    setIsLoadingKey(true)
    setError(null)

    try {
      const response = await apiCallWithRefresh((token) => 
        authApi.getMyStreamKey(token)
      )
      setStreamKey(response.stream_key)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch stream key'
      console.error('Error fetching stream key:', err)
      setError(errorMsg)
    } finally {
      setIsLoadingKey(false)
    }
  }

  const handleUpgradeToStreamer = async () => {
    setIsUpgrading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiCallWithRefresh((token) =>
        authApi.upgradeToStreamer(token)
      )
      setSuccess(response.message)
      
      // Refresh user data to get updated roles
      await refresh()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upgrade to streamer'
      console.error('Error upgrading to streamer:', err)
      
      if (errorMessage.includes('409')) {
        setError('You are already a streamer')
      } else if (errorMessage.includes('412')) {
        setError('Please verify your email before upgrading to streamer')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleResetStreamKey = async () => {
    setShowResetModal(true)
  }

  const confirmResetStreamKey = async () => {
    setShowResetModal(false)
    setIsResetting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiCallWithRefresh((token) =>
        authApi.resetMyStreamKey(token)
      )
      setStreamKey(response.stream_key)
      setSuccess('Stream key reset successfully')
      setShowKey(true)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to reset stream key'
      console.error('Error resetting stream key:', err)
      setError(errorMsg)
    } finally {
      setIsResetting(false)
    }
  }

  const cancelResetStreamKey = () => {
    setShowResetModal(false)
  }

  const copyToClipboard = async () => {
    if (!streamKey) return

    try {
      await navigator.clipboard.writeText(streamKey)
      setSuccess('Stream key copied to clipboard!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
  }

  const handleUpdateMetadata = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSavingMetadata(true)
    setError(null)
    setSuccess(null)

    const payload = {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    }

    try {
      await apiCallWithRefresh((token) => streamApi.updateMetadata(token, payload))
      setSuccess('Stream metadata updated successfully')
      if (user?.user_id) {
        const storageKey = `stream_metadata_${user.user_id}`
        localStorage.setItem(
          storageKey,
          JSON.stringify({ title: payload.title || title, description: payload.description || description })
        )
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update stream metadata'
      console.error('Error updating stream metadata:', err)
      setError(errorMsg)
    } finally {
      setIsSavingMetadata(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60 mt-2">
            Manage your streaming settings
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

        {/* Streamer Section */}
        {!isStreamer ? (
          <div className="bg-background border border-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Become a Streamer
              </h2>
              <p className="text-foreground/60 mt-2">
                Upgrade your account to start streaming content to your audience.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-3">
                What you'll get:
              </h3>
              <ul className="space-y-2 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Your own streaming channel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Unique stream key for broadcasting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Access to streaming analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Ability to customize your channel</span>
                </li>
              </ul>
            </div>

            {!user?.is_verified && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400">
                  ⚠️ Please verify your email address before upgrading to streamer.
                </p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgradeToStreamer}
              disabled={isUpgrading || !user?.is_verified}
              className="w-full"
            >
              {isUpgrading ? 'Upgrading...' : 'Upgrade to Streamer'}
            </Button>
          </div>
        ) : (
          <div className="bg-background border border-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Stream Settings
              </h2>
              <p className="text-foreground/60 mt-2">
                Manage your stream key and broadcasting settings
              </p>
            </div>

            <div className="flex gap-2 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('stream-key')}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'stream-key'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Stream Key
              </button>
              <button
                onClick={() => setActiveTab('metadata')}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'metadata'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Stream Metadata
              </button>
            </div>

            {activeTab === 'stream-key' ? (
              <>
                {/* Stream Key Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Stream Key</h3>
                    {streamKey && (
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="text-sm text-primary hover:underline"
                      >
                        {showKey ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>

                  {isLoadingKey ? (
                    <div className="flex items-center gap-2 text-foreground/60">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading stream key...</span>
                    </div>
                  ) : streamKey ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-foreground/5 border border-gray-800 rounded-lg p-3 font-mono text-sm break-all text-foreground">
                          {showKey ? streamKey : maskKey(streamKey)}
                        </div>
                        <Button
                          variant="outline"
                          onClick={copyToClipboard}
                          className="whitespace-nowrap"
                        >
                          Copy
                        </Button>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm text-yellow-400">
                          <strong>Important:</strong> Keep your stream key private. Anyone with access
                          to it can stream to your channel.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="dark-outline"
                          onClick={handleResetStreamKey}
                          disabled={isResetting}
                        >
                          {isResetting ? 'Resetting...' : 'Reset Stream Key'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-foreground/60">
                      Unable to load stream key. Please try refreshing the page.
                    </div>
                  )}

                  {/* Reset Stream Key Confirmation Modal */}
                  <ConfirmModal
                    isOpen={showResetModal}
                    title="Reset Stream Key"
                    description="Are you sure you want to reset your stream key? Your old key will stop working immediately and cannot be recovered."
                    confirmLabel="Reset"
                    cancelLabel="Cancel"
                    isDanger={true}
                    onConfirm={confirmResetStreamKey}
                    onCancel={cancelResetStreamKey}
                  />
                </div>

                {/* Streaming Instructions */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    How to Stream
                  </h3>
                  <div className="space-y-4 text-foreground/80">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">1. Configure your streaming software</p>
                      <p className="text-sm text-foreground/60">Use OBS Studio, Streamlabs, or any RTMP-compatible software.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">2. Set your RTMP URL</p>
                      <code className="block bg-foreground/5 border border-gray-800 p-3 rounded mt-2 text-sm text-foreground">
                        rtmp://your-server-domain/live
                      </code>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">3. Enter your stream key</p>
                      <p className="text-sm text-foreground/60">Copy the stream key from above and paste it into your streaming software.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">4. Start streaming</p>
                      <p className="text-sm text-foreground/60">Click "Start Streaming" in your software and your stream will go live!</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Stream Metadata</h3>
                <p className="text-sm text-foreground/60">
                  Update your stream title and description. Changes are applied immediately.
                </p>
                {metadataLoadError && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      {metadataLoadError}
                    </p>
                  </div>
                )}
                <form onSubmit={handleUpdateMetadata} className="space-y-4">
                  <TextInput
                    name="title"
                    label="Title"
                    type="text"
                    placeholder="Enter your stream title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="text-primary">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Describe your stream"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      disabled={isSavingMetadata || isLoadingMetadata}
                    >
                      {isSavingMetadata || isLoadingMetadata ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
