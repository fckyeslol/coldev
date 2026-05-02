import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { option_id?: string }
  const optionId = body?.option_id
  if (!optionId) return NextResponse.json({ error: 'option_id required' }, { status: 400 })

  // Verify the option belongs to this poll.
  const { data: option } = await supabase
    .from('poll_options').select('id, poll_id').eq('id', optionId).maybeSingle()
  if (!option || option.poll_id !== pollId) {
    return NextResponse.json({ error: 'Opción inválida' }, { status: 400 })
  }

  // Upsert: one vote per user per poll. If they already voted, switch.
  const { error } = await supabase
    .from('poll_votes')
    .upsert(
      { poll_id: pollId, user_id: user.id, option_id: optionId },
      { onConflict: 'poll_id,user_id' },
    )
  if (error) {
    console.error('poll vote error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return updated tallies for this poll.
  const { data: options } = await supabase
    .from('poll_options')
    .select('id, position, text, votes_count')
    .eq('poll_id', pollId)
    .order('position', { ascending: true })

  return NextResponse.json({ options: options ?? [], my_vote: optionId })
}
