import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rankCandidates } from '@/lib/matching'
import type { Goal, Proficiency } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load current user's matching data
  const [{ data: myLangs }, { data: myGoals }, { data: myInterests }, { data: myProfile }] = await Promise.all([
    supabase.from('user_languages').select('language_id, proficiency').eq('user_id', user.id),
    supabase.from('user_goals').select('goal').eq('user_id', user.id),
    supabase.from('user_interests').select('topic_id').eq('user_id', user.id),
    supabase.from('profiles').select('activity_score').eq('id', user.id).single(),
  ])

  const currentUser = {
    id: user.id,
    languages: (myLangs ?? []).map((l) => ({ language_id: l.language_id, proficiency: l.proficiency as Proficiency })),
    goals: (myGoals ?? []).map((g) => g.goal as Goal),
    interests: (myInterests ?? []).map((i) => i.topic_id),
    activity_score: myProfile?.activity_score ?? 0,
  }

  // Load all candidates (excluding current user, excluding already followed)
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = new Set((followingData ?? []).map((f) => f.following_id))

  const { data: candidates } = await supabase
    .from('profiles')
    .select(`
      *,
      user_languages(language_id, proficiency),
      user_goals(goal),
      user_interests(topic_id)
    `)
    .neq('id', user.id)
    .eq('is_open_to_connect', true)
    .limit(100)

  if (!candidates) return NextResponse.json({ matches: [] })

  const candidateSnapshots = candidates
    .filter((c) => !followingIds.has(c.id))
    .map((c) => ({
      id: c.id,
      languages: (c.user_languages ?? []).map((l: { language_id: number; proficiency: string }) => ({
        language_id: l.language_id,
        proficiency: l.proficiency as Proficiency,
      })),
      goals: (c.user_goals ?? []).map((g: { goal: string }) => g.goal as Goal),
      interests: (c.user_interests ?? []).map((i: { topic_id: number }) => i.topic_id),
      activity_score: c.activity_score ?? 0,
      profile: c,
    }))

  const ranked = rankCandidates(currentUser, candidateSnapshots)

  return NextResponse.json({ matches: ranked.slice(0, 20) })
}
