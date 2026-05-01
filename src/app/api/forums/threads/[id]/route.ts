import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: thread, error } = await supabase
    .from('forum_threads')
    .select(`
      id, title, content, score, comments_count, created_at, forum_id,
      author:profiles!forum_threads_user_id_fkey(id, username, full_name, avatar_url, level),
      forum:forums!forum_threads_forum_id_fkey(id, slug, name, icon, color)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('thread fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const { data: comments } = await supabase
    .from('forum_comments')
    .select(`
      id, content, created_at,
      author:profiles!forum_comments_user_id_fkey(id, username, full_name, avatar_url, level)
    `)
    .eq('thread_id', id)
    .order('created_at', { ascending: true })

  // My vote if logged in
  const { data: { user } } = await supabase.auth.getUser()
  let myVote = 0
  if (user) {
    const { data: vote } = await supabase
      .from('forum_thread_votes')
      .select('value')
      .eq('thread_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    myVote = vote?.value ?? 0
  }

  return NextResponse.json({
    thread: { ...thread, my_vote: myVote },
    comments: comments ?? [],
  })
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('forum_threads').delete().eq('id', id).eq('user_id', user.id)
  if (error) {
    console.error('delete thread error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
