import { User } from '@/types/auth'
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ValidateResponse,
    RefreshRequest,
    RefreshResponse,
    StreamKeyResponse,
    UpgradeResponse,
    UpdateProfilePictureRequest,
    UpdateProfilePictureResponse,
} from './auth.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

const json = async (res: Response) => {
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error: ${res.status} - ${errorText}`)
    }
    return res.json()
}

export const authApi = {
    // -------- AUTH --------
    login(data: LoginRequest): Promise<LoginResponse> {
        return fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(json)
    },

    register(data: RegisterRequest): Promise<RegisterResponse> {
        return fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(json)
    },

    logout(accessToken: string): Promise<void> {
        return fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(() => undefined)
    },

    validate(accessToken: string): Promise<ValidateResponse> {
        return fetch(`${API_URL}/auth/validate`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(json)
    },
    verifyEmail(token: string): Promise<{ message: string }> {
        return fetch(`${API_URL}/auth/verify-email?token=${token}`).then(json)
    },

    refresh(data: RefreshRequest): Promise<RefreshResponse> {
        return fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(json)
    },

    getCurrentUser(accessToken: string): Promise<User> {
        return fetch(`${API_URL}/auth`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then(json)
    },

    // -------- STREAMER --------
    upgradeToStreamer(accessToken: string): Promise<UpgradeResponse> {
        return fetch(`${API_URL}/auth/upgrade`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(json)
    },

    getMyStreamKey(accessToken: string): Promise<StreamKeyResponse> {
        return fetch(`${API_URL}/auth/stream-key`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(json)
    },

    resetMyStreamKey(accessToken: string): Promise<StreamKeyResponse> {
        return fetch(`${API_URL}/auth/stream-key/reset`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(json)
    },

    // -------- PROFILE --------
    updateProfilePicture(accessToken: string, data: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse> {
        return fetch(`${API_URL}/auth/profile-picture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
        }).then(json)
    },
}