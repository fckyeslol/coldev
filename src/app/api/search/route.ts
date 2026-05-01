import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/search?q=...&type=all|users|posts
// Searches devs by name/username/bio/city and posts by content.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const type = searchParams.get('type') ?? 'all'

  if (!q) return NextResponse.json({ users: [], posts: [] })

  const supabase = await createClient()
  const escaped = q.replace(/[%_]/g, '\\$&')
  const like = `%${escaped}%`

  const wantUsers = type === 'all' || type === 'users'
  const wantPosts = type === 'all' || type === 'posts'

  const usersPromise = wantUsers
    ? supabase
        .from('profiles')
        .select(`
          id, username, full_name, avatar_url, bio, city, level, is_open_to_connect,
          user_languages(proficiency, language:languages(id, name, color))
        `)
        .or(`username.ilike.${like},full_name.ilike.${like},bio.ilike.${like},city.ilike.${like}`)
        .order('activity_score', { ascending: false })
        .limit(20)
        .then((r) => r)
    : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null })

  const postsPromise = wantPosts
    ? supabase
        .from('posts')
        .select(`
          id, content, image_url, likes_count, replies_count, reposts_count, created_at,
          profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level)
        `)
        .ilike('content', like)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(20)
        .then((r) => r)
    : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null })

  const [usersResult, postsResult] = await Promise.all([usersPromise, postsPromise])

  if (usersResult.error) console.error('search users error:', usersResult.error)
  if (postsResult.error) console.error('search posts error:', postsResult.error)

  return NextResponse.json({
    users: usersResult.data ?? [],
    posts: postsResult.data ?? [],
  })
}
