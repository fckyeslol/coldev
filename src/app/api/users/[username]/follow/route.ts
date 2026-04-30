import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: target } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', target.id)
    .single()

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id).eq('following_id', target.id)
    return NextResponse.json({ following: false })
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: target.id })
    if (target.id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: target.id, actor_id: user.id, type: 'follow',
      })
    }
    return NextResponse.json({ following: true })
  }
}
