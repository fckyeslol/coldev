'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Post, Profile } from '@/types'
import PostCard from '@/components/feed/PostCard'
import ComposeBox from '@/components/feed/ComposeBox'

type FeedTab = 'all' | 'following'

export default function FeedClient({ profile }: { profile: Profile }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [tab, setTab] = useState<FeedTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchPosts = useCallback(async (c?: string, opts?: { tab: FeedTab; q: string }) => {
    const params = new URLSearchParams()
    if (c) params.set('cursor', c)
    if (opts?.tab === 'following') params.set('feed', 'following')
    if (opts?.q) params.set('q', opts.q)
    try {
      const res = await fetch(`/api/posts${params.toString() ? `?${params}` : ''}`)
      if (!res.ok) { setError('No se pudieron cargar los posts'); return }
      const { posts: newPosts } = await res.json()
      if (!Array.isArray(newPosts)) { setError('Error inesperado'); return }
      if (newPosts.length < 20) setHasMore(false); else setHasMore(true)
      setPosts(prev => c ? [...prev, ...newPosts] : newPosts)
      if (newPosts.length > 0) setCursor(newPosts[newPosts.length - 1].created_at)
      else setCursor(null)
      setError(null)
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setLoading(true)
    setHasMore(true)
    setCursor(null)
    fetchPosts(undefined, { tab, q: debouncedSearch })
  }, [tab, debouncedSearch, fetchPosts])

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
        background: 'var(--bg-primary)',
        borderBottom: '1.5px solid var(--border)', padding: '24px',
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Feed
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
          Comunidad de desarrolladores en Colombia
        </p>
      </div>

      <ComposeBox profile={profile} onPost={handleNewPost} />

      {/* Search filter */}
      <div style={{ padding: '10px 16px', background: 'var(--bg-card)', borderBottom: '1.5px solid var(--border)' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          placeholder="Filtrar el feed por contenido..."
          style={{ fontSize: 13, padding: '8px 14px' }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', background: 'var(--bg-card)' }}>
        {([
          { key: 'all', label: 'Para ti' },
          { key: 'following', label: 'Siguiendo' },
        ] as const).map(({ key, label }) => {
          const active = tab === key
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '13px 0', fontSize: 14, fontWeight: active ? 700 : 500,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: active ? 'var(--accent-dark)' : 'var(--text-muted)',
              borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              transition: 'all 0.15s',
            }}>{label}</button>
          )
        })}
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
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--text)' }}>
            {debouncedSearch
              ? 'Sin resultados'
              : tab === 'following'
                ? 'Aún no sigues a nadie'
                : 'Sé el primero en publicar'}
          </p>
          <p style={{ fontSize: 14, marginTop: 8, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 360, marginInline: 'auto' }}>
            {debouncedSearch
              ? `Probaste con "${debouncedSearch}". Cambia el filtro o vuelve a "Para ti".`
              : tab === 'following'
                ? 'Encuentra devs en Explorar para llenar tu feed.'
                : 'Comparte qué estás trabajando, una duda, o un logro.'}
          </p>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.map(post => (
        <PostCard key={post.id} post={post} onLike={handleLike} />
      ))}

      {!loading && !error && hasMore && posts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <button
            onClick={() => fetchPosts(cursor ?? undefined, { tab, q: debouncedSearch })}
            className="btn btn-secondary"
            style={{ fontSize: 13 }}
          >
            Cargar más
          </button>
        </div>
      )}
      {!loading && !error && !hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 14, color: 'var(--text-muted)' }}>
          Ya viste todo por hoy
        </div>
      )}
    </div>
  )
}
