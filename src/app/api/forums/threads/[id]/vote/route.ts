import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/forums/threads/[id]/vote { value: 1 | -1 }
// Toggles: same value -> remove vote; different value -> switch.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { value?: number }
  const value = body?.value
  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: 'value must be 1 or -1' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('forum_thread_votes')
    .select('value')
    .eq('thread_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.value === value) {
    // Toggle off
    const { error } = await supabase
      .from('forum_thread_votes')
      .delete()
      .eq('thread_id', id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ my_vote: 0 })
  }

  const { error } = await supabase
    .from('forum_thread_votes')
    .upsert({ thread_id: id, user_id: user.id, value }, { onConflict: 'thread_id,user_id' })
  if (error) {
    console.error('vote upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ my_vote: value })
}
