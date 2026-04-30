import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = [
  'full_name',
  'bio',
  'city',
  'level',
  'github_url',
  'linkedin_url',
  'website_url',
  'avatar_url',
  'is_open_to_connect',
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Partial<Record<AllowedField, unknown>> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  if (typeof update.full_name === 'string' && !update.full_name.trim()) {
    return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
  }
  if (typeof update.bio === 'string' && update.bio.length > 160) {
    return NextResponse.json({ error: 'Bio máximo 160 caracteres' }, { status: 400 })
  }

  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Save related data if provided
    if ('languages' in body && Array.isArray(body.languages)) {
      await supabase.from('user_languages').delete().eq('user_id', user.id)
      if (body.languages.length > 0) {
        await supabase.from('user_languages').insert(
          body.languages.map((l: { language_id: number; proficiency: string }) => ({
            user_id: user.id,
            language_id: l.language_id,
            proficiency: l.proficiency,
          }))
        )
      }
    }

    if ('goals' in body && Array.isArray(body.goals)) {
      await supabase.from('user_goals').delete().eq('user_id', user.id)
      if (body.goals.length > 0) {
        await supabase.from('user_goals').insert(
          (body.goals as string[]).map((goal) => ({ user_id: user.id, goal }))
        )
      }
    }

    if ('interests' in body && Array.isArray(body.interests)) {
      await supabase.from('user_interests').delete().eq('user_id', user.id)
      if (body.interests.length > 0) {
        await supabase.from('user_interests').insert(
          (body.interests as number[]).map((topic_id) => ({ user_id: user.id, topic_id }))
        )
      }
    }

    return NextResponse.json({ profile: data })
  }

  // Only relational data being updated (no profile fields)
  if ('languages' in body && Array.isArray(body.languages)) {
    await supabase.from('user_languages').delete().eq('user_id', user.id)
    if (body.languages.length > 0) {
      await supabase.from('user_languages').insert(
        body.languages.map((l: { language_id: number; proficiency: string }) => ({
          user_id: user.id,
          language_id: l.language_id,
          proficiency: l.proficiency,
        }))
      )
    }
  }

  if ('goals' in body && Array.isArray(body.goals)) {
    await supabase.from('user_goals').delete().eq('user_id', user.id)
    if (body.goals.length > 0) {
      await supabase.from('user_goals').insert(
        (body.goals as string[]).map((goal) => ({ user_id: user.id, goal }))
      )
    }
  }

  if ('interests' in body && Array.isArray(body.interests)) {
    await supabase.from('user_interests').delete().eq('user_id', user.id)
    if (body.interests.length > 0) {
      await supabase.from('user_interests').insert(
        (body.interests as number[]).map((topic_id) => ({ user_id: user.id, topic_id }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}
