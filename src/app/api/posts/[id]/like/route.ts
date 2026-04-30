import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: post_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', post_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post_id)
    return NextResponse.json({ liked: false })
  } else {
    await supabase.from('post_likes').insert({ user_id: user.id, post_id })
    const { data: post } = await supabase
      .from('posts').select('user_id').eq('id', post_id).maybeSingle()
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id, actor_id: user.id, type: 'like', post_id,
      })
    }
    return NextResponse.json({ liked: true })
  }
}
