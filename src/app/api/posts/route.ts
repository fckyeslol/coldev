import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const userId = searchParams.get('userId')
    const feed = searchParams.get('feed') // 'following' | null
    const q = searchParams.get('q')?.trim()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level, city,
          user_languages(proficiency, language:languages(id, name, color))
        ),
        poll:polls!polls_post_id_fkey(
          id, question, closes_at,
          options:poll_options(id, position, text, votes_count)
        )
      `)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (userId) query = query.eq('user_id', userId)
    if (cursor) query = query.lt('created_at', cursor)
    if (q) query = query.ilike('content', `%${q.replace(/[%_]/g, '\\$&')}%`)

    if (feed === 'following') {
      if (!user) return NextResponse.json({ posts: [] })
      const { data: follows } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id)
      const ids = (follows ?? []).map((f) => f.following_id)
      if (ids.length === 0) return NextResponse.json({ posts: [] })
      query = query.in('user_id', ids)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      const pollIds = posts.flatMap((p) => p.poll?.id ? [p.poll.id] : [])
      const [{ data: likes }, { data: reposts }, { data: bookmarksData }, { data: polls }] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('post_reposts').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('bookmarks').select('target_id').eq('user_id', user.id).eq('target_type', 'post').in('target_id', postIds),
        pollIds.length > 0
          ? supabase.from('poll_votes').select('poll_id, option_id').eq('user_id', user.id).in('poll_id', pollIds)
          : Promise.resolve({ data: [] as { poll_id: string; option_id: string }[] }),
      ])
      const likedSet = new Set(likes?.map((l) => l.post_id) ?? [])
      const repostedSet = new Set(reposts?.map((r) => r.post_id) ?? [])
      const bookmarkedSet = new Set(bookmarksData?.map((b) => b.target_id) ?? [])
      const myVoteByPoll = new Map(((polls ?? []) as { poll_id: string; option_id: string }[]).map((v) => [v.poll_id, v.option_id]))
      posts.forEach((p) => {
        p.has_liked = likedSet.has(p.id)
        p.has_reposted = repostedSet.has(p.id)
        p.has_bookmarked = bookmarkedSet.has(p.id)
        if (p.poll?.id) p.poll.my_vote = myVoteByPoll.get(p.poll.id) ?? null
      })
    }

    return NextResponse.json({ posts: posts ?? [] })
  } catch (err: any) {
    console.error('Posts API error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error', stack: err.stack }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, language_tags, topic_tags, parent_id, image_url, poll } = await request.json() as {
      content?: string
      language_tags?: number[]
      topic_tags?: number[]
      parent_id?: string | null
      image_url?: string | null
      poll?: { question: string; options: string[] } | null
    }
    // Allow image/video-only posts (empty text)
    if (!content?.trim() && !image_url) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    if ((content ?? '').length > 280) return NextResponse.json({ error: 'Too long' }, { status: 400 })

    let createdId: string | null = null
    let postRow: Record<string, unknown> | null = null

    if (poll && poll.question?.trim() && Array.isArray(poll.options) && poll.options.length >= 2) {
      // Atomic: post + poll + options via RPC.
      const cleanedOptions = poll.options
        .map((o) => o.trim())
        .filter((o) => o.length > 0 && o.length <= 80)
        .slice(0, 4)
      if (cleanedOptions.length < 2) {
        return NextResponse.json({ error: 'La encuesta requiere al menos 2 opciones' }, { status: 400 })
      }
      const { data: id, error: rpcErr } = await supabase.rpc('create_post_with_poll', {
        p_content: content.trim(),
        p_language_tags: language_tags ?? [],
        p_topic_tags: topic_tags ?? [],
        p_image_url: image_url ?? null,
        p_poll_question: poll.question.trim().slice(0, 200),
        p_poll_options: cleanedOptions,
      })
      if (rpcErr || !id) {
        console.error('create_post_with_poll error:', rpcErr)
        return NextResponse.json({ error: rpcErr?.message ?? 'No se pudo crear el post' }, { status: 500 })
      }
      createdId = id as string
    } else {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content?.trim() ?? '',
          language_tags: language_tags ?? [],
          topic_tags: topic_tags ?? [],
          parent_id: parent_id ?? null,
          image_url: image_url ?? null,
        })
        .select(`*, profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level)`)
        .single()
      if (error) {
        console.error('Post insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      postRow = data
      createdId = data.id as string
    }

    if (!postRow) {
      const { data: refetched } = await supabase
        .from('posts')
        .select(`*, profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level)`)
        .eq('id', createdId)
        .single()
      postRow = refetched
    }
    const data = postRow as { id: string; user_id: string } & Record<string, unknown>

    // No DB trigger exists for replies_count; bump it manually for replies.
    if (parent_id) {
      const { data: parent } = await supabase
        .from('posts').select('user_id, replies_count').eq('id', parent_id).maybeSingle()
      if (parent) {
        await supabase.from('posts')
          .update({ replies_count: (parent.replies_count ?? 0) + 1 })
          .eq('id', parent_id)
        if (parent.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: parent.user_id, actor_id: user.id, type: 'reply', post_id: data.id,
          })
        }
      }
    }

    return NextResponse.json({ post: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
