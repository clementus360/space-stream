import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

export const storageApi = {
  /**
   * Upload a profile picture to Supabase storage
   * @param userId - The user ID to organize uploads
   * @param file - The image file to upload
   * @returns The public URL of the uploaded image
   */
  async uploadProfilePicture(userId: number, file: File): Promise<string> {
    const supabase = getSupabaseClient()

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }

    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}-${timestamp}.${fileExt}`
    const filePath = `profile-pictures/${userId}/${fileName}`

    try {
      const { error } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw new Error(error.message)
      }

      // Get the public URL
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      throw new Error(`Failed to upload profile picture: ${err.message}`)
    }
  },

  /**
   * Delete a profile picture from Supabase storage
   * @param userId - The user ID
   * @param fileName - The file name to delete
   */
  async deleteProfilePicture(userId: number, fileName: string): Promise<void> {
    const supabase = getSupabaseClient()

    try {
      const filePath = `profile-pictures/${userId}/${fileName}`
      
      const { error } = await supabase.storage
        .from('profiles')
        .remove([filePath])

      if (error) {
        throw new Error(error.message)
      }
    } catch (err: any) {
      throw new Error(`Failed to delete profile picture: ${err.message}`)
    }
  },
}
