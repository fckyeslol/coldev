import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/PostCard'
import type { Post } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts').select('content').eq('id', id).maybeSingle()
  if (!post) return { title: 'Post no encontrado · coldev' }
  const text = post.content as string
  return {
    title: `${text.slice(0, 60)}${text.length > 60 ? '…' : ''} · coldev`,
    description: text.slice(0, 160),
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, level, city,
        user_languages(proficiency, language:languages(id, name, color))
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) console.error('post fetch error:', error)
  if (!post) notFound()

  let hasLiked = false
  let hasReposted = false
  if (user) {
    const [{ data: like }, { data: repost }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle(),
      supabase.from('post_reposts').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle(),
    ])
    hasLiked = !!like
    hasReposted = !!repost
  }

  const fullPost = { ...post, has_liked: hasLiked, has_reposted: hasReposted } as unknown as Post

  return (
    <div className="layout-root">
      <main className="layout-main" style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Link href="/feed" aria-label="Volver" style={{
            fontSize: 18, color: 'var(--text-muted)', textDecoration: 'none',
          }}>←</Link>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Post
          </h1>
        </div>

        <PostCard post={fullPost} initialOpenComments />
      </main>
    </div>
  )
}
