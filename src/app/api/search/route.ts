import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/search?q=...&type=all|users|posts
// Searches devs by name/username/bio/city + by stack (language name) + by interest topic name.
// Searches posts by content.
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

  // For users we run two cheap queries in parallel: profile fields + matching language/topic ids.
  const [
    profileMatches,
    matchingLangs,
    matchingTopics,
  ] = await Promise.all([
    wantUsers
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
      : Promise.resolve({ data: [] as unknown[], error: null } as { data: unknown[]; error: null }),
    wantUsers
      ? supabase.from('languages').select('id').ilike('name', like).then((r) => r)
      : Promise.resolve({ data: [] as { id: number }[], error: null } as { data: { id: number }[]; error: null }),
    wantUsers
      ? supabase.from('topics').select('id').ilike('name', like).then((r) => r)
      : Promise.resolve({ data: [] as { id: number }[], error: null } as { data: { id: number }[]; error: null }),
  ])

  type ProfileRow = {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    bio: string | null
    city: string
    level: string
    is_open_to_connect: boolean
    user_languages: { proficiency: string; language: { id: number; name: string; color: string } | null }[]
  }

  const profileById = new Map<string, ProfileRow>()
  ;((profileMatches.data ?? []) as ProfileRow[]).forEach((p) => profileById.set(p.id, p))

  // If query matches a language or topic, pull devs that use them too.
  const langIds = (matchingLangs.data ?? []).map((r) => r.id)
  const topicIds = (matchingTopics.data ?? []).map((r) => r.id)

  if (langIds.length > 0) {
    const { data: byLang } = await supabase
      .from('user_languages')
      .select(`
        user_id,
        profile:profiles!user_languages_user_id_fkey(
          id, username, full_name, avatar_url, bio, city, level, is_open_to_connect,
          user_languages(proficiency, language:languages(id, name, color))
        )
      `)
      .in('language_id', langIds)
      .limit(50)
    for (const row of (byLang ?? []) as unknown as { profile: ProfileRow | null }[]) {
      if (row.profile) profileById.set(row.profile.id, row.profile)
    }
  }

  if (topicIds.length > 0) {
    const { data: byTopic } = await supabase
      .from('user_interests')
      .select(`
        user_id,
        profile:profiles!user_interests_user_id_fkey(
          id, username, full_name, avatar_url, bio, city, level, is_open_to_connect,
          user_languages(proficiency, language:languages(id, name, color))
        )
      `)
      .in('topic_id', topicIds)
      .limit(50)
    for (const row of (byTopic ?? []) as unknown as { profile: ProfileRow | null }[]) {
      if (row.profile) profileById.set(row.profile.id, row.profile)
    }
  }

  const users = Array.from(profileById.values())

  // Posts (if requested)
  const { data: postRows, error: postsErr } = wantPosts
    ? await supabase
        .from('posts')
        .select(`
          id, content, image_url, likes_count, replies_count, reposts_count, created_at,
          profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level)
        `)
        .ilike('content', like)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] as unknown[], error: null }

  if (postsErr) console.error('search posts error:', postsErr)

  return NextResponse.json({
    users,
    posts: postRows ?? [],
  })
}
