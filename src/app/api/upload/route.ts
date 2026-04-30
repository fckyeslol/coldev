import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'post-images'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!file.type.startsWith('image/'))
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Max file size is 5MB' }, { status: 400 })

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('Storage upload error:', error)
    const msg = /not\s*found|does not exist/i.test(error.message)
      ? `Bucket "${BUCKET}" no existe en Supabase Storage. Crea el bucket y aplica supabase/storage.sql.`
      : error.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}
