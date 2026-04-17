# Supabase Setup for Profile Pictures

## Installation

Install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

## Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project:
1. Go to Settings > API in your Supabase dashboard
2. Copy the Project URL and anon key

## Supabase Storage Setup

1. In your Supabase dashboard, go to Storage
2. Create a new bucket called `profiles`
3. Set the bucket to **Public** (so images can be accessed via URL)
4. Add a Row Level Security (RLS) policy to allow authenticated users to upload:
   - Policy name: `Allow users to upload their own profile pictures`
   - Allowed operation: SELECT, INSERT, UPDATE
   - Target roles: authenticated
   - Using expression: `auth.uid()::text = user_id::text`

## How Profile Pictures Work

1. **Upload Flow**: 
   - User selects an image from dashboard
   - Image is uploaded to Supabase storage (`profiles/user_id/filename`)
   - Public URL is returned
   - URL is sent to backend API
   - Backend updates user's `profile_image_url`
   - Frontend displays the profile picture

2. **Display Flow**:
   - Avatar component checks for `profile_image_url`
   - If URL exists, displays the image
   - If no URL, shows initials as fallback

3. **Used In**:
   - Dashboard (profile picture upload)
   - Header (user menu avatar)
   - Sidebar (stream thumbnails if available)
   - Any place where user profile is displayed

## File Size & Format Limits

- **Max size**: 5MB
- **Formats**: JPG, PNG, GIF
- These are enforced on the client side in `storageApi.uploadProfilePicture()`

## API Integration

The profile picture update uses the existing auth provider's `apiCallWithRefresh`, so it automatically handles:
- Token expiration and refresh
- Retry on 401 errors
- Error handling and user feedback
