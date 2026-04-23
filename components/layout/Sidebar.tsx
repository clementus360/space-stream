'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useUI } from '@/context/ui-provider'
import { useStreams } from '@/context/stream-provider'
import { useEffect } from 'react'

export function StreamSidebar() {
    const { isSideMenuOpen } = useUI()
    const { liveStreams, loading, fetchLiveStreams } = useStreams()

    // Fetch only when sidebar opens
    useEffect(() => {
        if (isSideMenuOpen) {
            fetchLiveStreams(24, { silent: true })
        }
    }, [isSideMenuOpen, fetchLiveStreams])

    if (!isSideMenuOpen) return null

    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-black/10 bg-background pt-32 transition duration-300 md:block">

            {isSideMenuOpen &&
                <div className="px-4 pb-2 text-sm font-semibold text-muted-foreground">
                    Live Channels
                </div>
            }

            <div className="flex flex-col gap-1 px-2">
                {loading && (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                        Loading streams…
                    </div>
                )}

                {!loading && liveStreams?.length === 0 && (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                        No live streams
                    </div>
                )}

                {liveStreams?.slice(0, 20).map((stream) => (
                    <Link
                        key={stream.session_id}
                        href={`/stream/${stream.username}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-accent"
                    >
                        {/* Avatar */}
                        <Avatar
                            src={stream.profile_image_url}
                            alt={stream.username}
                            username={stream.username}
                            size="md"
                        />

                        {/* Info */}
                        {isSideMenuOpen &&
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {stream.username}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {stream.viewer_count?.toLocaleString()}
                                </div>
                            </div>
                        }
                    </Link>
                ))}
            </div>
        </aside>
    )
}