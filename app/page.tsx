"use client"

import { useAuth } from "@/context/auth-provider";
import { useStreams } from "@/context/stream-provider";
import { Avatar, StreamLoadError, StreamThumbnail } from "@/components";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const { liveStreams, loading, error, fetchLiveStreams } = useStreams();

  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  const handleRetry = () => {
    fetchLiveStreams(24, { silent: false });
  };

  return (
    <div className="min-h-screen pb-16 px-4">
      <section className="pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">Live channels</h1>
            <p className="text-sm text-muted-foreground mt-2">See what is live right now.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`stream-skeleton-${index}`}
                className="animate-pulse rounded-xl border border-black/10 bg-white/70 dark:bg-black/20 p-4"
              >
                <div className="h-40 w-full rounded-lg bg-black/10" />
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black/10" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 rounded bg-black/10" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-black/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <StreamLoadError error={error} onRetry={handleRetry} />
        ) : liveStreams.length === 0 ? (
          <div className="mt-8 rounded-xl border border-foreground/10 bg-foreground/5 p-6 text-sm text-muted-foreground">
            No one is live yet. Check back soon.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {liveStreams.map((stream) => {
              const streamUrl = `${process.env.NEXT_PUBLIC_DISTRIBUTION_API_URL}/watch/${stream.session_id}/master.m3u8`
              return (
                <a
                  key={`${stream.channel_id}-${stream.session_id}`}
                  href={`/watch/${stream.username}`}
                  className="group rounded-xl border border-black/10 dark:bg-black/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer block"
                >
                  <article>
                    <div className="relative w-full rounded-t-xl overflow-hidden">
                      <StreamThumbnail
                        streamUrl={streamUrl}
                        alt={`${stream.username} - ${stream.title}`}
                        width={320}
                        height={180}
                        fallbackGradient="bg-gradient-to-br from-black/80 via-black/50 to-primary/60"
                        lazy={true}
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white z-10">
                        Live
                      </div>
                      <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white z-10">
                        {stream.viewer_count.toLocaleString()} watching
                      </div>
                      <div className="absolute bottom-3 left-3 text-sm font-semibold text-white z-10 max-w-[calc(100%-24px)] truncate">
                        {stream.title || "Untitled Stream"}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={stream.profile_image_url}
                          alt={stream.username}
                          username={stream.username}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {stream.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {stream.title || "Untitled Stream"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                </a>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
}
