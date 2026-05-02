import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Target = 'post' | 'thread'

function isTarget(v: unknown): v is Target {
  return v === 'post' || v === 'thread'
}

// POST { target_type: 'post' | 'thread', target_id }  → toggles
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { target_type?: string; target_id?: string }
  if (!isTarget(body.target_type) || !body.target_id) {
    return NextResponse.json({ error: 'target_type/target_id required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('target_type', body.target_type)
    .eq('target_id', body.target_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('bookmarks').delete()
      .eq('user_id', user.id)
      .eq('target_type', body.target_type)
      .eq('target_id', body.target_id)
    return NextResponse.json({ bookmarked: false })
  }

  const { error } = await supabase.from('bookmarks').insert({
    user_id: user.id, target_type: body.target_type, target_id: body.target_id,
  })
  if (error) {
    console.error('bookmark insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ bookmarked: true })
}
