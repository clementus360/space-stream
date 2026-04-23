import {
    GetLiveStreamsResponse,
    StreamInfo,
    UpdateStreamMetadataRequest,
    UpdateStreamMetadataResponse,
} from './stream.types'
import { normalizeViewerCount } from '@/utils/viewers'

const STREAM_API_URL = process.env.NEXT_PUBLIC_STREAM_API_URL!

const json = (res: Response) => {
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
    }
    return res.json()
}

const normalizeStreamInfo = (stream: any): StreamInfo => {
    return {
        channel_id: stream.channel_id ?? stream.channelId,
        session_id: stream.session_id ?? stream.sessionId,
        username: stream.username,
        title: stream.title,
        description: stream.description,
        viewer_count: normalizeViewerCount(
            stream.viewer_count ??
                stream.viewerCount ??
                stream.viewers ??
                stream.viewers_count ??
                stream.viewersCount ??
                0
        ),
        resolution: stream.resolution,
        profile_image_url: stream.profile_image_url ?? stream.profileImageUrl ?? null,
    }
}

export const streamApi = {
    async getLiveStreams(limit = 20): Promise<GetLiveStreamsResponse> {
        const data = await fetch(`${STREAM_API_URL}/v1/streams/live?limit=${limit}`).then(json)
        return {
            streams: Array.isArray(data.streams) ? data.streams.map(normalizeStreamInfo) : [],
        }
    },

    async getStream(identifier: string): Promise<StreamInfo> {
        const data = await fetch(`${STREAM_API_URL}/v1/streams/${identifier}`).then(json)
        return normalizeStreamInfo(data)
    },

    updateMetadata(
        accessToken: string,
        data: UpdateStreamMetadataRequest
    ): Promise<UpdateStreamMetadataResponse> {
        return fetch(`${STREAM_API_URL}/v1/streams/metadata`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
        }).then(json)
    },
}