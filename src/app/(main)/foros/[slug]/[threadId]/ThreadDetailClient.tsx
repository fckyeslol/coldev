'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

interface Author {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  level: string
}

export interface Thread {
  id: string
  title: string
  content: string
  score: number
  comments_count: number
  created_at: string
  my_vote: number
  author: Author | null
  forum: { id: number; slug: string; name: string; icon: string | null; color: string | null } | null
}

export interface Comment {
  id: string
  content: string
  created_at: string
  author: Author | null
}

export default function ThreadDetailClient({
  thread, initialComments, isAuthed, isOwner,
}: {
  thread: Thread
  initialComments: Comment[]
  isAuthed: boolean
  isOwner: boolean
}) {
  const router = useRouter()
  const [score, setScore] = useState(thread.score)
  const [myVote, setMyVote] = useState<number>(thread.my_vote)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleVote(value: 1 | -1) {
    if (!isAuthed) { router.push('/login'); return }
    const prev = myVote
    const next = prev === value ? 0 : value
    setMyVote(next)
    setScore((s) => s + (next - prev))
    const res = await fetch(`/api/forums/threads/${thread.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    if (!res.ok) {
      setMyVote(prev)
      setScore((s) => s - (next - prev))
    }
  }

  async function handleComment() {
    if (posting) return
    const content = text.trim()
    if (!content) return
    setPosting(true)
    setErr(null)
    try {
      const res = await fetch(`/api/forums/threads/${thread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data?.error ?? 'No se pudo comentar'); return }
      setComments((c) => [...c, data.comment])
      setText('')
    } catch {
      setErr('Error de conexión')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este tema y todos sus comentarios?')) return
    setDeleting(true)
    const res = await fetch(`/api/forums/threads/${thread.id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/foros/${thread.forum?.slug ?? ''}`)
    else setDeleting(false)
  }

  const author = thread.author
  const forum = thread.forum

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderTop: `3px solid ${forum?.color ?? 'var(--accent)'}`,
      }}>
        <Link href={`/foros/${forum?.slug ?? ''}`} aria-label="Volver" style={{
          fontSize: 18, color: 'var(--text-muted)', textDecoration: 'none',
        }}>←</Link>
        {forum && (
          <Link href={`/foros/${forum.slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 700, color: forum.color ?? 'var(--accent)',
            textDecoration: 'none',
          }}>
            <span>{forum.icon ?? '💬'}</span>{forum.name}
          </Link>
        )}
      </div>

      {/* Thread body */}
      <article style={{
        display: 'flex', gap: 14, padding: '20px 20px 16px',
        background: 'var(--bg-card)', borderBottom: '1.5px solid var(--border)',
      }}>
        {/* Vote rail */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          flexShrink: 0, paddingTop: 4,
        }}>
          <VoteBtn dir="up" active={myVote === 1} onClick={() => handleVote(1)} />
          <span style={{
            fontSize: 14, fontWeight: 800,
            color: myVote === 1 ? 'var(--accent)' : myVote === -1 ? '#3178C6' : 'var(--text)',
          }}>
            {score}
          </span>
          <VoteBtn dir="down" active={myVote === -1} onClick={() => handleVote(-1)} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.25,
            color: 'var(--text)',
          }}>
            {thread.title}
          </h1>
          <p style={{
            margin: '12px 0 16px', fontSize: 14, lineHeight: 1.65, color: 'var(--text)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {thread.content}
          </p>

          {/* Author + meta */}
          {author && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
            }}>
              <Link href={`/perfil/${author.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                <Avatar src={author.avatar_url} name={author.full_name} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {author.full_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    @{author.username} · {timeAgo(thread.created_at)}
                  </p>
                </div>
              </Link>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8,
                    border: '1.5px solid var(--border)', background: 'var(--bg-card)',
                    color: '#C65D3B', cursor: deleting ? 'wait' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {deleting ? '...' : 'Eliminar'}
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Comment composer */}
      <div style={{ padding: 16, background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border)' }}>
        {isAuthed ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comparte tu opinión, código o pregunta..."
              rows={3}
              maxLength={2000}
              className="input"
              style={{ resize: 'vertical', fontSize: 14, background: 'var(--bg-card)' }}
            />
            {err && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#C65D3B', fontWeight: 600 }}>{err}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{text.length}/2000</span>
              <button
                onClick={handleComment}
                disabled={!text.trim() || posting}
                className="btn btn-primary"
                style={{ fontSize: 13, opacity: !text.trim() || posting ? 0.5 : 1 }}
              >
                {posting ? '...' : 'Comentar'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Inicia sesión</Link> para comentar.
          </p>
        )}
      </div>

      {/* Comments */}
      <div>
        <div style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
          {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
        </div>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>💭</div>
            <p style={{ fontSize: 13, margin: 0 }}>Sé el primero en comentar.</p>
          </div>
        ) : (
          comments.map((c) => {
            const a = c.author
            if (!a) return null
            return (
              <div key={c.id} style={{
                display: 'flex', gap: 10, padding: '12px 20px',
                borderTop: '1.5px solid var(--border)',
              }}>
                <Link href={`/perfil/${a.username}`}>
                  <Avatar src={a.avatar_url} name={a.full_name} size="sm" />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Link href={`/perfil/${a.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                      {a.full_name}
                    </Link>
                    <span>@{a.username}</span>
                    <span>·</span>
                    <span>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{
                    margin: '4px 0 0', fontSize: 14, color: 'var(--text)', lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {c.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function VoteBtn({ dir, active, onClick }: { dir: 'up' | 'down'; active: boolean; onClick: () => void }) {
  const color = active ? (dir === 'up' ? 'var(--accent)' : '#3178C6') : 'var(--text-dim)'
  return (
    <button onClick={onClick} aria-label={dir === 'up' ? 'Upvote' : 'Downvote'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color, lineHeight: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'down' ? 'rotate(180deg)' : undefined }}>
        <path d="M5 14l7-7 7 7" />
      </svg>
    </button>
  )
}
