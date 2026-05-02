import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'

interface Props {
  params: Promise<{ username: string }>
}

interface LanguageRow { id: number; name: string; color: string }
interface TopicRow { id: number; name: string; icon: string }

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch the profile separately so a failing relation can't 404 the page.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (profileError) console.error('profile lookup error:', profileError)
  if (!profile) notFound()

  // Fetch raw rows + counts. We do the language/topic join manually below
  // because PostgREST's FK-based relationship resolver has been flaky after
  // some of the schema migrations (returns null even when the rows exist).
  const [
    userLangsRes,
    userGoalsRes,
    userInterestsRes,
    { count: followersCount },
    { count: followingCount },
    { count: postsCount },
    isFollowingData,
    isFollowedByData,
  ] = await Promise.all([
    supabase
      .from('user_languages')
      .select('language_id, proficiency')
      .eq('user_id', profile.id),
    supabase.from('user_goals').select('goal').eq('user_id', profile.id),
    supabase.from('user_interests').select('topic_id').eq('user_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    currentUser
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    currentUser
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', profile.id)
          .eq('following_id', currentUser.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (userLangsRes.error)     console.error('user_languages fetch error:', userLangsRes.error)
  if (userGoalsRes.error)     console.error('user_goals fetch error:', userGoalsRes.error)
  if (userInterestsRes.error) console.error('user_interests fetch error:', userInterestsRes.error)

  const langRows = (userLangsRes.data ?? []) as { language_id: number; proficiency: string }[]
  const goalRows = (userGoalsRes.data ?? []) as { goal: string }[]
  const interestRows = (userInterestsRes.data ?? []) as { topic_id: number }[]

  console.log(`[profile/${username}] raw rows`, {
    user_id: profile.id,
    langRows, goalRows, interestRows,
  })

  // Manual join: hydrate language_id → language object, topic_id → topic object.
  const langIds = Array.from(new Set(langRows.map((r) => r.language_id)))
  const topicIds = Array.from(new Set(interestRows.map((r) => r.topic_id)))

  const [languagesRes, topicsRes] = await Promise.all([
    langIds.length > 0
      ? supabase.from('languages').select('id, name, color').in('id', langIds)
      : Promise.resolve({ data: [] as LanguageRow[], error: null }),
    topicIds.length > 0
      ? supabase.from('topics').select('id, name, icon').in('id', topicIds)
      : Promise.resolve({ data: [] as TopicRow[], error: null }),
  ])

  if (languagesRes.error) console.error('languages fetch error:', languagesRes.error)
  if (topicsRes.error)    console.error('topics fetch error:', topicsRes.error)

  const langById = new Map(((languagesRes.data ?? []) as LanguageRow[]).map((l) => [l.id, l]))
  const topicById = new Map(((topicsRes.data ?? []) as TopicRow[]).map((t) => [t.id, t]))

  console.log(`[profile/${username}] joins`, {
    langIds, topicIds,
    languages_returned: (languagesRes.data ?? []).length,
    topics_returned: (topicsRes.data ?? []).length,
  })

  const user_languages = langRows
    .map((r) => {
      const language = langById.get(r.language_id)
      if (!language) return null
      return { language, proficiency: r.proficiency as 'aprendiendo' | 'cómodo' | 'experto' }
    })
    .filter((x): x is { language: LanguageRow; proficiency: 'aprendiendo' | 'cómodo' | 'experto' } => x !== null)

  const user_interests = interestRows
    .map((r) => {
      const topic = topicById.get(r.topic_id)
      if (!topic) return null
      return { topic }
    })
    .filter((x): x is { topic: TopicRow } => x !== null)

  const initiallyFollowing = !!isFollowingData.data
  const isConnected = initiallyFollowing || !!isFollowedByData.data

  return (
    <ProfileClient
      profile={{
        ...profile,
        user_languages,
        user_goals: goalRows,
        user_interests,
        followers_count: followersCount ?? 0,
        following_count: followingCount ?? 0,
        posts_count: postsCount ?? 0,
      }}
      isOwnProfile={currentUser?.id === profile.id}
      initiallyFollowing={initiallyFollowing}
      isConnected={isConnected}
    />
  )
}
