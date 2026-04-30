import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: post_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('post_reposts')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', post_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reposts').delete().eq('user_id', user.id).eq('post_id', post_id)
    return NextResponse.json({ reposted: false })
  } else {
    await supabase.from('post_reposts').insert({ user_id: user.id, post_id })
    const { data: post } = await supabase
      .from('posts').select('user_id').eq('id', post_id).maybeSingle()
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id, actor_id: user.id, type: 'repost', post_id,
      })
    }
    return NextResponse.json({ reposted: true })
  }
}
