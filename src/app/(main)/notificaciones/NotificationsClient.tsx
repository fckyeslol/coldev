'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

export interface NotificationRow {
  id: string
  type: 'follow' | 'like' | 'repost' | 'reply' | 'match' | string
  post_id: string | null
  read: boolean
  created_at: string
  actor: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  } | null
  post: {
    id: string
    content: string
  } | null
}

const TYPE_META: Record<string, { icon: string; verb: string; tint: string }> = {
  follow: { icon: '➕', verb: 'empezó a seguirte', tint: '#3178C6' },
  like:   { icon: '❤️', verb: 'le dio me gusta a tu post', tint: '#E87952' },
  repost: { icon: '🔁', verb: 'reposteó tu publicación', tint: '#8BA888' },
  reply:  { icon: '💬', verb: 'respondió a tu post', tint: '#7F52FF' },
  match:  { icon: '✨', verb: 'es un match contigo', tint: '#F4A847' },
}

export default function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState<NotificationRow[]>(initial)
  const [marking, setMarking] = useState(false)

  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (unread === 0) return
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      setMarking(true)
      try {
        await fetch('/api/notifications', { method: 'PATCH' })
        if (!cancelled) setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      } finally {
        if (!cancelled) setMarking(false)
      }
    }, 1200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [unread])

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Notificaciones 🔔
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={async () => {
              setMarking(true)
              await fetch('/api/notifications', { method: 'PATCH' })
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
              setMarking(false)
            }}
            disabled={marking}
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              background: 'none', border: 'none', cursor: marking ? 'wait' : 'pointer',
              fontFamily: 'inherit', padding: '4px 8px', borderRadius: 8,
            }}
          >
            Marcar todo como leído
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔕</div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Aún no hay notificaciones</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Cuando alguien te siga, le dé like, repostee<br />o responda a tus posts, lo verás aquí.
          </p>
        </div>
      ) : (
        items.map((n) => <NotificationItem key={n.id} n={n} />)
      )}
    </div>
  )
}

function NotificationItem({ n }: { n: NotificationRow }) {
  const meta = TYPE_META[n.type] ?? { icon: '🔔', verb: 'interactuó contigo', tint: 'var(--text-muted)' }
  const actor = n.actor

  if (!actor) return null

  const href =
    n.type === 'follow' ? `/perfil/${actor.username}` :
    n.post_id ? `/perfil/${actor.username}` :
    `/perfil/${actor.username}`

  return (
    <Link
      href={href}
      style={{
        display: 'flex', gap: 12, padding: '14px 20px',
        borderBottom: '1.5px solid var(--border)',
        background: n.read ? 'transparent' : 'var(--accent-light)',
        textDecoration: 'none', color: 'inherit',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-light)')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar src={actor.avatar_url} name={actor.full_name} size="md" />
        <span style={{
          position: 'absolute', right: -4, bottom: -4,
          background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          borderRadius: '50%', width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: meta.tint,
        }}>
          {meta.icon}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: 'var(--text)' }}>
          <span style={{ fontWeight: 700 }}>{actor.full_name}</span>{' '}
          <span style={{ color: 'var(--text-muted)' }}>@{actor.username}</span>{' '}
          {meta.verb}
        </p>
        {n.post && (
          <p style={{
            margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {n.post.content}
          </p>
        )}
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
          {timeAgo(n.created_at)}
        </p>
      </div>

      {!n.read && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
          flexShrink: 0, alignSelf: 'center',
        }} />
      )}
    </Link>
  )
}
