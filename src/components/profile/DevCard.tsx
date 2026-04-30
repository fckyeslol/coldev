'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MatchedProfile } from '@/types'
import { LEVEL_LABELS } from '@/types'
import Avatar from '@/components/ui/Avatar'
import MatchRing from '@/components/ui/MatchRing'

export default function DevCard({ dev }: { dev: MatchedProfile }) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${dev.username}/follow`, { method: 'POST' })
      if (res.ok) setFollowing(f => !f)
    } finally { setLoading(false) }
  }

  const langs = dev.user_languages ?? []

  return (
    <Link href={`/perfil/${dev.username}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: 20, cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar src={dev.avatar_url} name={dev.full_name} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {dev.full_name}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  @{dev.username} · {dev.city}
                </p>
              </div>
              <MatchRing score={dev.match_score} size={44} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
                {LEVEL_LABELS[dev.level]}
              </span>
              {dev.is_open_to_connect && (
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                  ● Abierto a conectar
                </span>
              )}
            </div>

            {dev.bio && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {dev.bio}
              </p>
            )}

            {langs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {langs.slice(0, 4).map(({ language }) => (
                  <span key={language.id} style={{
                    fontSize: 11, padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                    color: language.color, border: `1.5px solid ${language.color}50`,
                    background: `${language.color}12`,
                  }}>
                    {language.name}
                  </span>
                ))}
                {langs.length > 4 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{langs.length - 4}</span>
                )}
              </div>
            )}

            {dev.match_reasons.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {dev.match_reasons.map(r => (
                  <span key={r} style={{
                    fontSize: 11, padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                    background: 'var(--accent-light)', color: 'var(--accent-dark)',
                    border: '1px solid var(--accent-glow)',
                  }}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1.5px solid var(--border)' }}>
          <button onClick={handleFollow} className={following ? 'btn btn-secondary' : 'btn btn-primary'}
            style={{ flex: 1, fontSize: 13, padding: '8px 0' }}>
            {loading ? '...' : following ? '✓ Siguiendo' : '+ Conectar'}
          </button>
          <button onClick={e => e.preventDefault()} className="btn btn-secondary"
            style={{ fontSize: 13, padding: '8px 16px' }}>
            💬 Mensaje
          </button>
        </div>
      </div>
    </Link>
  )
}
