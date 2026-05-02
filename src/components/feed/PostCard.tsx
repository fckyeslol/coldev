'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { Post } from '@/types'
import { LEVEL_LABELS, type UserLevel } from '@/types'
import Avatar from '@/components/ui/Avatar'
import { IconHeart, IconMessage, IconRepeat, IconShare, IconSend, IconBookmark } from '@/components/ui/Icons'
import Linkified from '@/components/ui/Linkified'
import PollCard from '@/components/feed/PollCard'
import { timeAgo } from '@/lib/utils'

interface Props {
  post: Post
  onLike?: (postId: string, liked: boolean) => void
  isComment?: boolean
  initialOpenComments?: boolean
}

function CommentItem({ comment }: { comment: Post }) {
  const [liked, setLiked] = useState(comment.has_liked ?? false)
  const [count, setCount] = useState(comment.likes_count)

  async function handleLike() {
    const newLiked = !liked
    setLiked(newLiked)
    setCount(c => newLiked ? c + 1 : c - 1)
    const res = await fetch(`/api/posts/${comment.id}/like`, { method: 'POST' })
    if (!res.ok) { setLiked(!newLiked); setCount(c => newLiked ? c - 1 : c + 1) }
  }

  const p = comment.profile
  if (!p) return null

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <Link href={`/perfil/${p.username}`}>
        <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href={`/perfil/${p.username}`}
            style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}>
            {p.full_name}
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>@{p.username}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>· {timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          <Linkified text={comment.content} />
        </p>
        <button onClick={handleLike} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: liked ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 12, fontFamily: 'inherit', padding: 0,
        }}>
          <IconHeart size={14} stroke={liked ? 'var(--accent)' : 'currentColor'} style={{ fill: liked ? 'var(--accent)' : 'none' }} />
          {count > 0 && <span>{count}</span>}
        </button>
      </div>
    </div>
  )
}

function CommentsSection({ postId, onCountChange }: { postId: string; onCountChange: (delta: number) => void }) {
  const [comments, setComments] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/posts/${postId}/comments`)
      .then(r => r.json())
      .then(({ comments: c }) => { if (!cancelled) { setComments(c ?? []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [postId])

  async function handleReply() {
    if (!text.trim() || posting) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim(), parent_id: postId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo publicar el comentario')
        return
      }
      setComments(prev => [...prev, data.post])
      onCountChange(1)
      setText('')
    } catch {
      setError('Error de conexión')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ borderTop: '1.5px solid var(--border)', background: 'var(--bg-secondary)' }}>
      {/* Reply input */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 16px',
        borderBottom: '1.5px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ flex: 1 }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe un comentario..."
            rows={2}
            maxLength={280}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply() }}
            style={{
              width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
              borderRadius: 10, padding: '8px 12px', fontSize: 13,
              color: 'var(--text)', fontFamily: 'inherit', resize: 'none', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <button
          onClick={handleReply}
          disabled={!text.trim() || posting}
          style={{
            background: text.trim() ? 'var(--accent)' : 'var(--border)',
            border: 'none', borderRadius: 10, padding: '0 14px',
            cursor: text.trim() && !posting ? 'pointer' : 'not-allowed',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s', flexShrink: 0,
            opacity: posting ? 0.6 : 1,
          }}
        >
          <IconSend size={16} stroke="white" />
        </button>
      </div>

      {error && (
        <div style={{
          margin: '8px 16px 0', padding: '8px 12px', borderRadius: 8, fontSize: 12,
          background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
        }}>{error}</div>
      )}

      {/* Comments list */}
      {loading ? (
        <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Cargando comentarios...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Sé el primero en comentar
        </div>
      ) : (
        comments.map(c => <CommentItem key={c.id} comment={c} />)
      )}
    </div>
  )
}

export default function PostCard({ post, onLike, isComment = false, initialOpenComments = false }: Props) {
  const [liked, setLiked] = useState(post.has_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [reposted, setReposted] = useState(post.has_reposted ?? false)
  const [repostsCount, setRepostsCount] = useState(post.reposts_count)
  const [repliesCount, setRepliesCount] = useState(post.replies_count)
  const [showComments, setShowComments] = useState(initialOpenComments)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(post.has_bookmarked ?? false)

  async function handleLike() {
    if (actionLoading) return
    setActionLoading('like')
    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount(c => newLiked ? c + 1 : c - 1)
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) { setLiked(!newLiked); setLikesCount(c => newLiked ? c - 1 : c + 1) }
      else onLike?.(post.id, newLiked)
    } catch {
      setLiked(!newLiked); setLikesCount(c => newLiked ? c - 1 : c + 1)
    }
    setActionLoading(null)
  }

  async function handleRepost() {
    if (actionLoading) return
    setActionLoading('repost')
    const newReposted = !reposted
    setReposted(newReposted)
    setRepostsCount(c => newReposted ? c + 1 : c - 1)
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { method: 'POST' })
      if (!res.ok) { setReposted(!newReposted); setRepostsCount(c => newReposted ? c - 1 : c + 1) }
    } catch {
      setReposted(!newReposted); setRepostsCount(c => newReposted ? c - 1 : c + 1)
    }
    setActionLoading(null)
  }

  async function handleBookmark() {
    const next = !bookmarked
    setBookmarked(next)
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: 'post', target_id: post.id }),
    })
    if (!res.ok) setBookmarked(!next)
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: try share API
      if (navigator.share) {
        navigator.share({ url, text: post.content.slice(0, 80) })
      }
    }
  }

  const profile = post.profile
  if (!profile) return null

  return (
    <div style={{ borderBottom: isComment ? 'none' : '1.5px solid var(--border)' }}>
      <article style={{
        display: 'flex', gap: 12, padding: '16px 20px',
        background: 'var(--bg-card)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
      >
        <Link href={`/perfil/${profile.username}`} onClick={e => e.stopPropagation()}>
          <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Link href={`/perfil/${profile.username}`}
              style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}>
              {profile.full_name}
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{profile.username}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(post.created_at)}</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 6,
              background: 'var(--bg-secondary)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', fontWeight: 600,
            }}>
              {LEVEL_LABELS[profile.level as UserLevel] ?? profile.level}
            </span>
          </div>

          {/* Content */}
          <p style={{ fontSize: 14, marginTop: 6, marginBottom: 0, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            <Linkified text={post.content} />
          </p>

          {/* Poll */}
          {post.poll && <PollCard poll={post.poll} />}

          {/* Media (image or video) */}
          {post.image_url && (
            <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
              {/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(post.image_url) ? (
                <video
                  src={post.image_url}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: 400, display: 'block', background: '#000' }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image_url}
                  alt="Post image"
                  style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
          )}

          {/* Language tags */}
          {post.profile?.user_languages && post.profile.user_languages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {post.profile.user_languages
                .filter(ul => ul.language)
                .slice(0, 3)
                .map(({ language }) => (
                  <span key={language.id} style={{
                    fontSize: 11, padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                    color: language.color,
                    border: `1.5px solid ${language.color}50`,
                    background: `${language.color}12`,
                  }}>
                    {language.name}
                  </span>
                ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
            {/* Like */}
            <ActionBtn
              onClick={handleLike}
              active={liked}
              activeColor="var(--accent)"
              hoverBg="var(--accent-light)"
              count={likesCount}
              icon={<IconHeart size={17} stroke={liked ? 'var(--accent)' : 'currentColor'} style={{ fill: liked ? 'var(--accent)' : 'none' }} />}
            />

            {/* Comment */}
            <ActionBtn
              onClick={() => setShowComments(s => !s)}
              active={showComments}
              activeColor="#3178C6"
              hoverBg="#3178C610"
              count={repliesCount}
              icon={<IconMessage size={17} stroke={showComments ? '#3178C6' : 'currentColor'} />}
            />

            {/* Repost */}
            <ActionBtn
              onClick={handleRepost}
              active={reposted}
              activeColor="var(--green)"
              hoverBg="var(--green-light)"
              count={repostsCount}
              icon={<IconRepeat size={17} stroke={reposted ? 'var(--green)' : 'currentColor'} />}
            />

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              aria-label={bookmarked ? 'Quitar guardado' : 'Guardar post'}
              title={bookmarked ? 'Quitar guardado' : 'Guardar'}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '5px 8px', borderRadius: 8,
                color: bookmarked ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!bookmarked) (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { if (!bookmarked) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >
              <IconBookmark size={17} stroke={bookmarked ? 'var(--accent)' : 'currentColor'} style={{ fill: bookmarked ? 'var(--accent)' : 'none' }} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title={copied ? '¡Enlace copiado!' : 'Compartir'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '5px 8px', borderRadius: 8,
                color: copied ? 'var(--green)' : 'var(--text-muted)',
                fontSize: 12, fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' } }}
              onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none' } }}
            >
              <IconShare size={17} />
              {copied && <span style={{ fontSize: 11, fontWeight: 600 }}>¡Copiado!</span>}
            </button>
          </div>
        </div>
      </article>

      {/* Comments section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          onCountChange={delta => setRepliesCount(c => c + delta)}
        />
      )}
    </div>
  )
}

function ActionBtn({
  onClick, active, activeColor, hoverBg, count, icon,
}: {
  onClick: () => void
  active: boolean
  activeColor: string
  hoverBg: string
  count: number
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', padding: '5px 8px', borderRadius: 8,
        color: active ? activeColor : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 700 : 400,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = activeColor; (e.currentTarget as HTMLElement).style.background = hoverBg }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = active ? activeColor : 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      {icon}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
