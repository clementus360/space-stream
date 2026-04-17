export type StreamInfo = {
    channel_id: number
    session_id: number
    username: string
    title: string
    description: string
    viewer_count: number
    resolution?: string
    profile_image_url?: string
}

export type GetLiveStreamsResponse = {
    streams: StreamInfo[]
}

export type UpdateStreamMetadataRequest = {
    title?: string
    description?: string
    channel_id?: number // only for internal/mTLS paths
}

export type UpdateStreamMetadataResponse = {
    success: boolean
}