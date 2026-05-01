import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')

  let q = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (cursor) q = q.lt('created_at', cursor)

  const { data, error } = await q
  if (error) {
    console.error('messages fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark as read.
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ messages: (data ?? []).reverse() })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { content?: string }
  const content = body?.content?.trim()
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'too long' }, { status: 400 })

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: id, sender_id: user.id, content })
    .select('id, conversation_id, sender_id, content, created_at')
    .single()

  if (error) {
    console.error('send message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: data })
}
