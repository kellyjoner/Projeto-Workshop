import { supabase } from './supabase'

const MAX_BYTES = 8 * 1024 * 1024

async function uploadToBucket(bucket: 'media' | 'avatars', folder: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione uma imagem (JPG, PNG, WEBP ou GIF).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Imagem muito grande. Máximo de 8MB.')
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600' })
  if (error) throw new Error('Falha ao enviar a imagem. Tente novamente.')
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function uploadPostImage(file: File, userId: string) {
  return uploadToBucket('media', `posts/${userId}`, file)
}

export function uploadStoryImage(file: File, userId: string) {
  return uploadToBucket('media', `stories/${userId}`, file)
}

export function uploadAvatar(file: File, userId: string) {
  return uploadToBucket('avatars', userId, file)
}
