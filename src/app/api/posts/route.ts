import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const userId = searchParams.get('userId')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level, city,
          user_languages(proficiency, language:languages(id, name, color))
        )
      `)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (userId) query = query.eq('user_id', userId)
    if (cursor) query = query.lt('created_at', cursor)

    const { data: posts, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      const [{ data: likes }, { data: reposts }] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('post_reposts').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      ])
      const likedSet = new Set(likes?.map((l) => l.post_id) ?? [])
      const repostedSet = new Set(reposts?.map((r) => r.post_id) ?? [])
      posts.forEach((p) => {
        p.has_liked = likedSet.has(p.id)
        p.has_reposted = repostedSet.has(p.id)
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

    const { content, language_tags, topic_tags, parent_id, image_url } = await request.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    if (content.length > 280) return NextResponse.json({ error: 'Too long' }, { status: 400 })

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
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
