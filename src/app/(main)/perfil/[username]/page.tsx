import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'

interface Props {
  params: Promise<{ username: string }>
}

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

  const [
    { data: userLanguages },
    { data: userGoals },
    { data: userInterests },
    { count: followersCount },
    { count: followingCount },
    { count: postsCount },
    isFollowingData,
    isFollowedByData,
  ] = await Promise.all([
    supabase
      .from('user_languages')
      .select('proficiency, language:languages(id, name, color)')
      .eq('user_id', profile.id),
    supabase.from('user_goals').select('goal').eq('user_id', profile.id),
    supabase
      .from('user_interests')
      .select('topic:topics(id, name, icon)')
      .eq('user_id', profile.id),
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

  const initiallyFollowing = !!isFollowingData.data
  const isConnected = initiallyFollowing || !!isFollowedByData.data

  return (
    <ProfileClient
      profile={{
        ...profile,
        user_languages: (userLanguages ?? []).filter((ul: { language: unknown }) => ul.language),
        user_goals: userGoals ?? [],
        user_interests: (userInterests ?? []).filter((ui: { topic: unknown }) => ui.topic),
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
