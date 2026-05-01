'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

export interface ForumDef {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

export interface ThreadRow {
  id: string
  title: string
  content: string
  score: number
  comments_count: number
  created_at: string
  my_vote: number
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    level: string
  } | null
}

type Sort = 'new' | 'top'

export default function ForumThreadsClient({
  forum, initialThreads, isAuthed,
}: { forum: ForumDef; initialThreads: ThreadRow[]; isAuthed: boolean }) {
  const router = useRouter()
  const [threads, setThreads] = useState<ThreadRow[]>(initialThreads)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<Sort>('new')
  const [showCompose, setShowCompose] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/forums/${forum.slug}/threads?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setThreads(data.threads ?? [])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [forum.slug, sort])

  async function handleVote(threadId: string, value: 1 | -1) {
    if (!isAuthed) { router.push('/login'); return }
    // Optimistic update
    setThreads((prev) => prev.map((t) => {
      if (t.id !== threadId) return t
      const same = t.my_vote === value
      const old = t.my_vote
      const next = same ? 0 : value
      return { ...t, my_vote: next, score: t.score + (next - old) }
    }))
    const res = await fetch(`/api/forums/threads/${threadId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    if (!res.ok) router.refresh()
  }

  async function handleCreate() {
    if (posting) return
    if (title.trim().length < 4) { setError('Título mínimo 4 caracteres'); return }
    if (!content.trim()) { setError('Escribe algo de contenido'); return }
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`/api/forums/${forum.slug}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? 'No se pudo publicar'); return }
      router.push(`/foros/${forum.slug}/${data.thread_id}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
        borderTop: `3px solid ${forum.color ?? 'var(--accent)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/foros" aria-label="Volver" style={{
              fontSize: 18, color: 'var(--text-muted)', textDecoration: 'none',
            }}>←</Link>
            <span style={{ fontSize: 24 }}>{forum.icon ?? '💬'}</span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {forum.name}
              </h1>
              {forum.description && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{forum.description}</p>
              )}
            </div>
          </div>
          {isAuthed && (
            <button
              onClick={() => setShowCompose((s) => !s)}
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '8px 14px', flexShrink: 0 }}
            >
              {showCompose ? 'Cancelar' : '+ Nuevo tema'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['new', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
                border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
                background: sort === s ? 'var(--accent)' : 'var(--bg-card)',
                color: sort === s ? 'white' : 'var(--text-muted)',
                borderColor: sort === s ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {s === 'new' ? '🕐 Nuevos' : '🔥 Top'}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div style={{ padding: 16, borderBottom: '1.5px solid var(--border)', background: 'var(--bg-card)' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del tema"
            maxLength={200}
            className="input"
            style={{ marginBottom: 10, fontSize: 15, fontWeight: 600 }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cuenta más detalles, comparte código, haz una pregunta..."
            rows={5}
            maxLength={5000}
            className="input"
            style={{ resize: 'vertical', fontSize: 14 }}
          />
          {error && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#C65D3B', fontWeight: 600 }}>{error}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {content.length}/5000
            </span>
            <button
              onClick={handleCreate}
              disabled={posting}
              className="btn btn-primary"
              style={{ fontSize: 13, opacity: posting ? 0.6 : 1 }}
            >
              {posting ? 'Publicando...' : 'Publicar tema'}
            </button>
          </div>
        </div>
      )}

      {/* Threads list */}
      <div>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1.5px solid var(--border)' }}>
              <div className="skeleton" style={{ width: 36, height: 60, borderRadius: 10 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🪴</div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Aún no hay temas en {forum.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Sé el primero en abrir una discusión.
            </p>
          </div>
        ) : (
          threads.map((t) => <ThreadCard key={t.id} thread={t} forumSlug={forum.slug} onVote={handleVote} />)
        )}
      </div>
    </div>
  )
}

function ThreadCard({
  thread, forumSlug, onVote,
}: {
  thread: ThreadRow
  forumSlug: string
  onVote: (id: string, value: 1 | -1) => void
}) {
  const author = thread.author
  return (
    <article style={{
      display: 'flex', gap: 12, padding: '14px 16px',
      borderBottom: '1.5px solid var(--border)',
      background: 'var(--bg-card)',
    }}>
      {/* Vote rail */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        flexShrink: 0, paddingTop: 2,
      }}>
        <VoteButton
          active={thread.my_vote === 1} dir="up"
          onClick={() => onVote(thread.id, 1)}
        />
        <span style={{ fontSize: 13, fontWeight: 800, color: thread.my_vote === 1 ? 'var(--accent)' : thread.my_vote === -1 ? '#3178C6' : 'var(--text)' }}>
          {thread.score}
        </span>
        <VoteButton
          active={thread.my_vote === -1} dir="down"
          onClick={() => onVote(thread.id, -1)}
        />
      </div>

      {/* Body */}
      <Link href={`/foros/${forumSlug}/${thread.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {thread.title}
        </h3>
        <p style={{
          margin: '4px 0 8px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {thread.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          {author && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Avatar src={author.avatar_url} name={author.full_name} size="sm" />
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{author.full_name}</span>
              <span>@{author.username}</span>
            </span>
          )}
          <span>· {timeAgo(thread.created_at)}</span>
          <span>· 💬 {thread.comments_count}</span>
        </div>
      </Link>
    </article>
  )
}

function VoteButton({ dir, active, onClick }: { dir: 'up' | 'down'; active: boolean; onClick: () => void }) {
  const color = active ? (dir === 'up' ? 'var(--accent)' : '#3178C6') : 'var(--text-dim)'
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'up' ? 'Upvote' : 'Downvote'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 2, color, lineHeight: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'down' ? 'rotate(180deg)' : undefined }}>
        <path d="M5 14l7-7 7 7" />
      </svg>
    </button>
  )
}
