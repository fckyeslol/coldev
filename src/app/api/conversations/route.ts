import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/conversations
// Lists current user's conversations with the other participant + last message preview.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myRows, error: partsErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)

  if (partsErr) {
    console.error('conversations parts error:', partsErr)
    return NextResponse.json({ error: partsErr.message }, { status: 500 })
  }

  const convIds = (myRows ?? []).map((r) => r.conversation_id)
  if (convIds.length === 0) return NextResponse.json({ conversations: [] })

  const lastRead = new Map((myRows ?? []).map((r) => [r.conversation_id, r.last_read_at]))

  const [{ data: convs }, { data: others }, { data: latestMsgs }] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, last_message_at, created_at')
      .in('id', convIds)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('conversation_participants')
      .select('conversation_id, user:profiles(id, username, full_name, avatar_url)')
      .in('conversation_id', convIds)
      .neq('user_id', user.id),
    supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ])

  const otherByConv = new Map<string, unknown>()
  for (const row of others ?? []) {
    if (!otherByConv.has(row.conversation_id)) {
      otherByConv.set(row.conversation_id, row.user)
    }
  }

  const lastMsgByConv = new Map<string, { content: string; created_at: string; sender_id: string }>()
  for (const m of latestMsgs ?? []) {
    if (!lastMsgByConv.has(m.conversation_id)) {
      lastMsgByConv.set(m.conversation_id, m)
    }
  }

  const list = (convs ?? []).map((c) => {
    const lastMsg = lastMsgByConv.get(c.id) ?? null
    const lr = lastRead.get(c.id)
    const unread = !!(lastMsg && lr && new Date(lastMsg.created_at) > new Date(lr) && lastMsg.sender_id !== user.id)
    return {
      id: c.id,
      last_message_at: c.last_message_at,
      other: otherByConv.get(c.id) ?? null,
      last_message: lastMsg,
      unread,
    }
  })

  return NextResponse.json({ conversations: list })
}

// POST /api/conversations { username }
// Opens (or creates) a 1:1 DM with another user. Requires a follow relation in either direction.
// Atomic: delegates to the start_or_get_dm RPC (SECURITY DEFINER) so the participant
// insert can't race the conversation INSERT under RLS.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { username?: string }
  const username = body?.username?.trim()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const { data: target } = await supabase
    .from('profiles').select('id').eq('username', username).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  if (target.id === user.id) return NextResponse.json({ error: 'No puedes mensajearte a ti mismo' }, { status: 400 })

  const { data: convId, error } = await supabase
    .rpc('start_or_get_dm', { target_user_id: target.id })

  if (error) {
    console.error('start_or_get_dm rpc error:', error)
    const status = /not authenticated|42501/i.test(error.message) ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ conversation_id: convId })
}
