import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'post-images'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]

const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isVideo = VIDEO_TYPES.includes(file.type)
  const isImage = IMAGE_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Solo se permiten imágenes o videos' }, { status: 400 })
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? 'Máximo 100MB para videos' : 'Máximo 10MB para imágenes' },
      { status: 400 },
    )
  }

  const ext = (file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')).toLowerCase()
  const folder = isVideo ? 'videos' : 'images'
  const path = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('Storage upload error:', error)
    const msg = /not\s*found|does not exist/i.test(error.message)
      ? `Bucket "${BUCKET}" no existe en Supabase Storage. Crea el bucket.`
      : error.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl, type: isVideo ? 'video' : 'image' })
}
