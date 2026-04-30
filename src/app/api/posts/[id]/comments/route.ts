import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: post_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level)
    `)
    .eq('parent_id', post_id)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (user && comments && comments.length > 0) {
    const ids = comments.map(c => c.id)
    const { data: likes } = await supabase
      .from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', ids)
    const likedSet = new Set(likes?.map(l => l.post_id) ?? [])
    comments.forEach(c => { c.has_liked = likedSet.has(c.id) })
  }

  return NextResponse.json({ comments: comments ?? [] })
}
