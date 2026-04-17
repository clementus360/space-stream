# Profile Picture Integration with Supabase

## Overview
Integrated Supabase Storage for profile picture uploads with proper image handling and display across the application.

## Components Created

### 1. Avatar Component (`components/ui/Avatar.tsx`)
- Reusable avatar display component
- Shows profile picture if available, falls back to user initials
- Supports 3 sizes: sm, md, lg
- Uses Next.js Image component for optimization
- Accepts `profile_image_url` from User type

### 2. Supabase Storage API (`utils/api/storage.ts`)
- `uploadProfilePicture(userId, file)` - Uploads to Supabase storage
- `deleteProfilePicture(userId, fileName)` - Deletes profile pictures
- Validates file type and size (5MB max)
- Returns public URL for uploaded image

## Types Updated

### User Type (`types/auth.ts`)
- Added optional `profile_image_url?: string` field

### StreamInfo Type (`utils/api/stream.types.ts`)
- Added optional `profile_image_url?: string` for stream thumbnails

### API Types (`utils/api/auth.types.ts`)
- Added `UpdateProfilePictureRequest` interface
- Added `UpdateProfilePictureResponse` interface

## API Functions Added

### authApi.updateProfilePicture() (`utils/api/auth.ts`)
- Makes POST request to `/auth/profile-picture`
- Sends profile_image_url to backend
- Updates user's profile picture

## UI Components Updated

### Header (`components/layout/Header.tsx`)
- Uses Avatar component instead of initials
- Displays user's profile picture in menu
- Shows in header button and dropdown

### Sidebar (`components/layout/Sidebar.tsx`)
- Uses Avatar component for stream thumbnails
- Displays `profile_image_url` if available from StreamInfo

### Dashboard (`app/dashboard/page.tsx`)
- Added profile picture upload section
- Large Avatar display (lg size)
- "Change Picture" button triggers file input
- Handles upload to Supabase + backend update
- Supports drag-and-drop (via file input)
- Shows loading state during upload
- Auto-refreshes user data after upload
- File size validation (5MB max)

## Flow

1. **Upload**: User selects image → Uploads to Supabase → Gets public URL → Sends to backend → User data refreshes
2. **Display**: Avatar component fetches `profile_image_url` → Shows image or initials
3. **Token Management**: Uses `apiCallWithRefresh()` so expired tokens are auto-refreshed

## Files Modified

- `types/auth.ts` - Added profile_image_url to User
- `utils/api/auth.types.ts` - Added profile picture request/response types  
- `utils/api/auth.ts` - Added updateProfilePicture function
- `utils/api/stream.types.ts` - Added profile_image_url to StreamInfo
- `components/index.ts` - Exported Avatar component
- `components/layout/Header.tsx` - Uses Avatar component
- `components/layout/Sidebar.tsx` - Uses Avatar component
- `app/dashboard/page.tsx` - Profile picture upload section

## Files Created

- `components/ui/Avatar.tsx` - Avatar component
- `utils/api/storage.ts` - Supabase storage utilities
- `SUPABASE_SETUP.md` - Setup documentation

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Installation

```bash
npm install @supabase/supabase-js
```

## Features

✅ Profile picture upload with validation
✅ Fallback to user initials if no picture
✅ Consistent Avatar component across app
✅ Automatic token refresh on upload
✅ File size and type validation
✅ Responsive design
✅ Dark mode support
✅ Proper error handling and user feedback
