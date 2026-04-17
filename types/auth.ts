// ---- Auth tokens ----
export type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: 'Bearer'
  issued_at?: number // Unix timestamp in milliseconds
}

// ---- User (mirrors proto User) ----
export enum UserStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  BANNED = 2,
}

export type User = {
  user_id: number
  username: string
  email: string
  roles: string[]
  status: UserStatus
  created_at: string // ISO string (from protobuf timestamp)
  is_verified: boolean
  profile_image_url?: string
}