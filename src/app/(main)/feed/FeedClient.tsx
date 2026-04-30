'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Post, Profile } from '@/types'
import PostCard from '@/components/feed/PostCard'
import ComposeBox from '@/components/feed/ComposeBox'

export default function FeedClient({ profile }: { profile: Profile }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  const fetchPosts = useCallback(async (c?: string) => {
    try {
      const res = await fetch(c ? `/api/posts?cursor=${c}` : '/api/posts')
      if (!res.ok) { setError('No se pudieron cargar los posts'); return }
      const { posts: newPosts } = await res.json()
      if (!Array.isArray(newPosts)) { setError('Error inesperado'); return }
      if (newPosts.length < 20) setHasMore(false)
      setPosts(prev => c ? [...prev, ...newPosts] : newPosts)
      if (newPosts.length > 0) setCursor(newPosts[newPosts.length - 1].created_at)
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleNewPost = (post: Post) => setPosts(prev => [post, ...prev])
  const handleLike = (postId: string, liked: boolean) =>
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, has_liked: liked, likes_count: liked ? p.likes_count + 1 : p.likes_count - 1 } : p
    ))

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Feed ☕
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            La comunidad dev de Colombia
          </p>
        </div>
        <span style={{ fontSize: 20 }}>🇨🇴</span>
      </div>

      <ComposeBox profile={profile} onPost={handleNewPost} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', background: 'var(--bg-card)' }}>
        {['Para ti', 'Siguiendo'].map((tab, i) => (
          <button key={tab} style={{
            flex: 1, padding: '13px 0', fontSize: 14, fontWeight: i === 0 ? 700 : 500,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: i === 0 ? 'var(--accent-dark)' : 'var(--text-muted)',
            borderBottom: i === 0 ? '2.5px solid var(--accent)' : '2.5px solid transparent',
            transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: 16, padding: '14px 16px', borderRadius: 12, fontSize: 14,
          background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
        }}>
          {error} —{' '}
          <button onClick={() => { setError(null); setLoading(true); fetchPosts() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontFamily: 'inherit', textDecoration: 'underline' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && [...Array(4)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1.5px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '65%', borderRadius: 6 }} />
          </div>
        </div>
      ))}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>
            ¡Sé el primero en publicar!
          </p>
          <p style={{ fontSize: 14, marginTop: 8, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Comparte qué estás aprendiendo,<br />una duda, o un logro 🚀
          </p>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.map(post => (
        <PostCard key={post.id} post={post} onLike={handleLike} />
      ))}

      {!loading && !error && hasMore && posts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <button onClick={() => fetchPosts(cursor ?? undefined)} className="btn btn-secondary" style={{ fontSize: 13 }}>
            Cargar más
          </button>
        </div>
      )}
      {!loading && !error && !hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 14, color: 'var(--text-muted)' }}>
          ☕ Ya viste todo por hoy
        </div>
      )}
    </div>
  )
}
