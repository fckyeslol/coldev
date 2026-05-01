import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'new' // 'new' | 'top'

  const supabase = await createClient()

  const { data: forum } = await supabase
    .from('forums').select('id, slug, name, description, icon, color').eq('slug', slug).maybeSingle()
  if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 })

  let q = supabase
    .from('forum_threads')
    .select(`
      id, title, content, score, comments_count, created_at,
      author:profiles!forum_threads_user_id_fkey(id, username, full_name, avatar_url, level)
    `)
    .eq('forum_id', forum.id)
    .limit(30)

  q = sort === 'top'
    ? q.order('score', { ascending: false }).order('created_at', { ascending: false })
    : q.order('created_at', { ascending: false })

  const { data: threads, error } = await q
  if (error) {
    console.error('threads list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach my vote (if logged in)
  const { data: { user } } = await supabase.auth.getUser()
  let myVotes = new Map<string, number>()
  if (user && threads && threads.length > 0) {
    const ids = threads.map((t) => t.id)
    const { data: votes } = await supabase
      .from('forum_thread_votes')
      .select('thread_id, value')
      .eq('user_id', user.id)
      .in('thread_id', ids)
    myVotes = new Map((votes ?? []).map((v) => [v.thread_id as string, v.value as number]))
  }

  const enriched = (threads ?? []).map((t) => ({
    ...t,
    my_vote: myVotes.get(t.id) ?? 0,
  }))

  return NextResponse.json({ forum, threads: enriched })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { title?: string; content?: string }
  const title = body?.title?.trim()
  const content = body?.content?.trim()
  if (!title || title.length < 4) return NextResponse.json({ error: 'Título mínimo 4 caracteres' }, { status: 400 })
  if (title.length > 200) return NextResponse.json({ error: 'Título máximo 200 caracteres' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Escribe algo de contenido' }, { status: 400 })
  if (content.length > 5000) return NextResponse.json({ error: 'Máximo 5000 caracteres' }, { status: 400 })

  const { data: forum } = await supabase.from('forums').select('id').eq('slug', slug).maybeSingle()
  if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('forum_threads')
    .insert({ forum_id: forum.id, user_id: user.id, title, content })
    .select('id')
    .single()

  if (error) {
    console.error('create thread error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ thread_id: data.id })
}
