'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

interface ConversationRow {
  id: string
  last_message_at: string | null
  unread: boolean
  other: { id: string; username: string; full_name: string; avatar_url: string | null } | null
  last_message: { content: string; created_at: string; sender_id: string } | null
}

export default function InboxClient() {
  const [items, setItems] = useState<ConversationRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/conversations')
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(data?.error ?? 'Error cargando inbox'); return }
        setItems(data.conversations ?? [])
      } catch {
        if (!cancelled) setError('Error de conexión')
      }
    }
    load()
    const interval = setInterval(load, 20_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Mensajes
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Conversaciones privadas con devs conectados
        </p>
      </div>

      {error && (
        <div style={{
          margin: 16, padding: '10px 12px', borderRadius: 10, fontSize: 13,
          background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
        }}>{error}</div>
      )}

      {items === null ? (
        [...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
            </div>
          </div>
        ))
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Aún no tienes mensajes</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Conecta con otros devs y abre una conversación desde su perfil.
          </p>
          <Link href="/explore" className="btn btn-primary" style={{ marginTop: 18, fontSize: 13 }}>
            Buscar devs →
          </Link>
        </div>
      ) : (
        items.map((c) => {
          if (!c.other) return null
          return (
            <Link
              key={c.id}
              href={`/mensajes/${c.id}`}
              style={{
                display: 'flex', gap: 12, padding: '14px 20px',
                borderBottom: '1.5px solid var(--border)', textDecoration: 'none', color: 'inherit',
                background: c.unread ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = c.unread ? 'var(--accent-light)' : 'transparent')}
            >
              <Avatar src={c.other.avatar_url} name={c.other.full_name} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: c.unread ? 800 : 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.other.full_name}{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>@{c.other.username}</span>
                  </p>
                  {c.last_message && (
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                      {timeAgo(c.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p style={{
                  margin: '2px 0 0', fontSize: 13,
                  color: c.unread ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: c.unread ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.last_message?.content ?? 'Sin mensajes todavía. Saluda.'}
                </p>
              </div>
              {c.unread && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                  alignSelf: 'center', flexShrink: 0,
                }} />
              )}
            </Link>
          )
        })
      )}
    </div>
  )
}
