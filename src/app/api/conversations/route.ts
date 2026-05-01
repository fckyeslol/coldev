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

  // Connection check: at least one of them follows the other.
  const [{ data: aFollowsB }, { data: bFollowsA }] = await Promise.all([
    supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', target.id).maybeSingle(),
    supabase.from('follows').select('follower_id').eq('follower_id', target.id).eq('following_id', user.id).maybeSingle(),
  ])
  if (!aFollowsB && !bFollowsA) {
    return NextResponse.json({ error: 'Solo puedes mensajear a devs con los que ya estás conectado' }, { status: 403 })
  }

  // Try to find an existing 1:1 conversation.
  const { data: myRows } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  const myConvIds = (myRows ?? []).map((r) => r.conversation_id)

  if (myConvIds.length > 0) {
    const { data: shared } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', target.id)
      .in('conversation_id', myConvIds)
      .limit(1)
      .maybeSingle()
    if (shared) return NextResponse.json({ conversation_id: shared.conversation_id, existed: true })
  }

  // Create the conversation + insert both participants.
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ created_by: user.id })
    .select('id')
    .single()
  if (convErr || !conv) {
    console.error('create conversation error:', convErr)
    return NextResponse.json({ error: convErr?.message ?? 'No se pudo crear la conversación' }, { status: 500 })
  }

  const { error: partErr } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: target.id },
    ])
  if (partErr) {
    console.error('add participants error:', partErr)
    return NextResponse.json({ error: partErr.message }, { status: 500 })
  }

  return NextResponse.json({ conversation_id: conv.id, existed: false })
}
