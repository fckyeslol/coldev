import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { content?: string }
  const content = body?.content?.trim()
  if (!content) return NextResponse.json({ error: 'Escribe algo' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Máximo 2000 caracteres' }, { status: 400 })

  const { data, error } = await supabase
    .from('forum_comments')
    .insert({ thread_id: id, user_id: user.id, content })
    .select(`
      id, content, created_at,
      author:profiles!forum_comments_user_id_fkey(id, username, full_name, avatar_url, level)
    `)
    .single()

  if (error) {
    console.error('comment create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
