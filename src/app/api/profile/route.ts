import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

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

interface SupabaseErr {
  message?: string
  details?: string
  hint?: string
  code?: string
}

function dump(err: SupabaseErr | null | undefined): string {
  if (!err) return ''
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(' · ')
}

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

  let savedProfile: Record<string, unknown> | null = null

  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Profile update error:', dump(error), error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    savedProfile = data
  }

  // Relational fields — surface errors instead of swallowing them.
  const failures: string[] = []

  if ('languages' in body && Array.isArray(body.languages)) {
    const { error: delErr } = await supabase
      .from('user_languages').delete().eq('user_id', user.id)
    if (delErr) {
      console.error('user_languages delete failed:', dump(delErr), delErr)
      failures.push(`Stack (delete): ${dump(delErr)}`)
    } else if (body.languages.length > 0) {
      const { error: insErr } = await supabase.from('user_languages').insert(
        body.languages.map((l: { language_id: number; proficiency: string }) => ({
          user_id: user.id,
          language_id: l.language_id,
          proficiency: l.proficiency,
        })),
      )
      if (insErr) {
        console.error('user_languages insert failed:', dump(insErr), insErr)
        failures.push(`Stack: ${dump(insErr)}`)
      }
    }
  }

  if ('goals' in body && Array.isArray(body.goals)) {
    const { error: delErr } = await supabase
      .from('user_goals').delete().eq('user_id', user.id)
    if (delErr) {
      console.error('user_goals delete failed:', dump(delErr), delErr)
      failures.push(`Buscando (delete): ${dump(delErr)}`)
    } else if (body.goals.length > 0) {
      const { error: insErr } = await supabase.from('user_goals').insert(
        (body.goals as string[]).map((goal) => ({ user_id: user.id, goal })),
      )
      if (insErr) {
        console.error('user_goals insert failed:', dump(insErr), insErr)
        failures.push(`Buscando: ${dump(insErr)}`)
      }
    }
  }

  if ('interests' in body && Array.isArray(body.interests)) {
    const { error: delErr } = await supabase
      .from('user_interests').delete().eq('user_id', user.id)
    if (delErr) {
      console.error('user_interests delete failed:', dump(delErr), delErr)
      failures.push(`Intereses (delete): ${dump(delErr)}`)
    } else if (body.interests.length > 0) {
      const { error: insErr } = await supabase.from('user_interests').insert(
        (body.interests as number[]).map((topic_id) => ({ user_id: user.id, topic_id })),
      )
      if (insErr) {
        console.error('user_interests insert failed:', dump(insErr), insErr)
        failures.push(`Intereses: ${dump(insErr)}`)
      }
    }
  }

  if (failures.length > 0) {
    return NextResponse.json({
      error: failures.join(' | '),
      failures,
      profile: savedProfile,
    }, { status: 500 })
  }

  // Bust the cache for any /perfil/[username] page so router.refresh() actually
  // sees the new langs/goals/interests instead of the stale RSC payload.
  try {
    revalidatePath('/perfil/[username]', 'page')
    revalidatePath('/perfil/me')
  } catch {}

  return NextResponse.json({ profile: savedProfile, ok: true })
}
