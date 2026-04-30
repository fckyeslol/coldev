import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const lang = searchParams.get('lang')

  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select(`
      *,
      user_languages(proficiency, language:languages(id, name, color))
    `)
    .order('activity_score', { ascending: false })
    .limit(30)

  if (q) {
    query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
  }

  const { data: users, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let result = users ?? []

  // Filter by language client-side (Supabase nested filters are complex)
  if (lang) {
    const langId = parseInt(lang)
    result = result.filter((u) =>
      u.user_languages?.some(
        (ul: { language: { id: number } | null }) => ul.language?.id === langId
      )
    )
  }

  return NextResponse.json({ users: result })
}
