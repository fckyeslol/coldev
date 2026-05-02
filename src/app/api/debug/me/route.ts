import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/debug/me — diagnostic dump of the current user's onboarding data.
// Remove or guard before production.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const [
    profileRes,
    langsRes,
    goalsRes,
    interestsRes,
    languagesCountRes,
    topicsCountRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name, level').eq('id', user.id).maybeSingle(),
    supabase.from('user_languages').select('*').eq('user_id', user.id),
    supabase.from('user_goals').select('*').eq('user_id', user.id),
    supabase.from('user_interests').select('*').eq('user_id', user.id),
    supabase.from('languages').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    auth_user_id: user.id,
    profile: profileRes.data,
    profile_error: profileRes.error?.message ?? null,

    user_languages_rows: langsRes.data,
    user_languages_count: langsRes.data?.length ?? 0,
    user_languages_error: langsRes.error?.message ?? null,

    user_goals_rows: goalsRes.data,
    user_goals_count: goalsRes.data?.length ?? 0,
    user_goals_error: goalsRes.error?.message ?? null,

    user_interests_rows: interestsRes.data,
    user_interests_count: interestsRes.data?.length ?? 0,
    user_interests_error: interestsRes.error?.message ?? null,

    languages_table_count: languagesCountRes.count ?? null,
    languages_table_error: languagesCountRes.error?.message ?? null,

    topics_table_count: topicsCountRes.count ?? null,
    topics_table_error: topicsCountRes.error?.message ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
