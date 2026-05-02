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
    // Un-repost
    await supabase.from('post_reposts').delete().eq('user_id', user.id).eq('post_id', post_id)

    // Decrement reposts_count (floor at 0)
    const { data: post } = await supabase
      .from('posts').select('reposts_count').eq('id', post_id).maybeSingle()
    if (post != null) {
      await supabase.from('posts')
        .update({ reposts_count: Math.max(0, (post.reposts_count ?? 1) - 1) })
        .eq('id', post_id)
    }

    return NextResponse.json({ reposted: false })
  } else {
    // Repost
    const { error: insErr } = await supabase
      .from('post_reposts').insert({ user_id: user.id, post_id })
    if (insErr) {
      console.error('repost insert error:', insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Increment reposts_count
    const { data: post } = await supabase
      .from('posts').select('reposts_count, user_id').eq('id', post_id).maybeSingle()
    if (post != null) {
      await supabase.from('posts')
        .update({ reposts_count: (post.reposts_count ?? 0) + 1 })
        .eq('id', post_id)

      // Notify original author
      if (post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id, actor_id: user.id, type: 'repost', post_id,
        })
      }
    }

    return NextResponse.json({ reposted: true })
  }
}
