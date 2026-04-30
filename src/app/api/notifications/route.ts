import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, type, post_id, read, created_at,
      actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url),
      post:posts!notifications_post_id_fkey(id, content)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const unread = (data ?? []).filter((n) => !n.read).length
  return NextResponse.json({ notifications: data ?? [], unread })
}

export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Notifications mark-read error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
