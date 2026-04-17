// ===== Login =====
export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: 'Bearer'
}

// ===== Register =====
export interface RegisterRequest {
    username: string
    password: string
    email: string
    roles?: string[] // backend ignores client roles anyway
}

export interface RegisterResponse {
    user_id: number
    message: string
}

// ===== Validate =====
export interface ValidateResponse {
    valid: boolean
    user_id?: number
    roles?: string[]
}

// ===== Refresh =====
export interface RefreshRequest {
    refresh_token: string
}

export interface RefreshResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    issued_at?: number // Unix timestamp in milliseconds
}

// ===== Streamer =====
export interface StreamKeyResponse {
    stream_key: string
}

export interface UpgradeResponse {
    status: 'success'
    message: string
}

// ===== Profile =====
export interface UpdateProfilePictureRequest {
    profile_image_url: string
}

export interface UpdateProfilePictureResponse {
    message: string
}