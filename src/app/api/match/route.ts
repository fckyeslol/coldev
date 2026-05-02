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

  // Exclude already-followed users
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = new Set((followingData ?? []).map((f) => f.following_id))

  // Fetch all candidates — no is_open_to_connect filter so we get a bigger pool
  const { data: candidates } = await supabase
    .from('profiles')
    .select(`
      *,
      user_languages(language_id, proficiency),
      user_goals(goal),
      user_interests(topic_id)
    `)
    .neq('id', user.id)
    .limit(150)

  if (!candidates) return NextResponse.json({ matches: [] })

  // ── Hydrate language_id → Language object ─────────────────────────────────
  const allLangIds = new Set<number>()
  for (const c of candidates) {
    for (const l of (c.user_languages ?? [])) allLangIds.add(l.language_id)
  }
  for (const l of (myLangs ?? [])) allLangIds.add(l.language_id)

  const langIdsArr = Array.from(allLangIds)
  const { data: languageRows } = langIdsArr.length > 0
    ? await supabase.from('languages').select('id, name, color, icon').in('id', langIdsArr)
    : { data: [] as { id: number; name: string; color: string; icon: string }[] }

  const langById = new Map((languageRows ?? []).map((l) => [l.id, l]))
  // ─────────────────────────────────────────────────────────────────────────

  const candidateSnapshots = candidates
    .filter((c) => !followingIds.has(c.id))
    .map((c) => {
      const rawLangs = (c.user_languages ?? []) as { language_id: number; proficiency: string }[]

      // user_languages hydrated with full Language object for the UI
      const hydratedLangs = rawLangs
        .map((l) => {
          const language = langById.get(l.language_id)
          if (!language) return null
          return { language, proficiency: l.proficiency as Proficiency }
        })
        .filter((x): x is { language: { id: number; name: string; color: string; icon: string }; proficiency: Proficiency } => x !== null)

      return {
        id: c.id,
        // Scoring uses raw language_id + proficiency
        languages: rawLangs.map((l) => ({ language_id: l.language_id, proficiency: l.proficiency as Proficiency })),
        goals: (c.user_goals ?? []).map((g: { goal: string }) => g.goal as Goal),
        interests: (c.user_interests ?? []).map((i: { topic_id: number }) => i.topic_id),
        activity_score: c.activity_score ?? 0,
        profile: {
          ...c,
          user_languages: hydratedLangs,
          user_goals: (c.user_goals ?? []) as { goal: Goal }[],
          user_interests: (c.user_interests ?? []) as { topic_id: number }[],
        },
      }
    })

  const ranked = rankCandidates(currentUser, candidateSnapshots)

  return NextResponse.json({ matches: ranked.slice(0, 20) })
}
