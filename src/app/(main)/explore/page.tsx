'use client'

import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import { LEVEL_LABELS } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

const LANGUAGES = [
  { id: 1,  name: 'JavaScript', color: '#F7DF1E' },
  { id: 2,  name: 'TypeScript', color: '#3178C6' },
  { id: 3,  name: 'Python',     color: '#3776AB' },
  { id: 4,  name: 'Java',       color: '#ED8B00' },
  { id: 5,  name: 'Kotlin',     color: '#7F52FF' },
  { id: 7,  name: 'Go',         color: '#00ADD8' },
  { id: 8,  name: 'Rust',       color: '#CE422B' },
  { id: 9,  name: 'C#',         color: '#239120' },
]

interface ProfileWithExtras extends Omit<Profile, 'user_languages'> {
  user_languages?: { proficiency: string; language: { id: number; name: string; color: string } }[]
}

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<ProfileWithExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLang, setSelectedLang] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedLang) params.set('lang', String(selectedLang))
    const timeout = setTimeout(() => {
      fetch(`/api/users?${params}`).then(r => r.json())
        .then(({ users }) => { setProfiles(users ?? []); setLoading(false) })
        .catch(() => setLoading(false))
    }, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [search, selectedLang])

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Sticky header + search */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Explorar 🔍</h1>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input" placeholder="Buscar devs por nombre o @usuario..." />

        {/* Language pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <button onClick={() => setSelectedLang(null)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            background: !selectedLang ? 'var(--accent)' : 'var(--bg-card)',
            borderColor: !selectedLang ? 'var(--accent)' : 'var(--border)',
            color: !selectedLang ? 'white' : 'var(--text-muted)',
          }}>Todos</button>
          {LANGUAGES.map(lang => (
            <button key={lang.id} onClick={() => setSelectedLang(selectedLang === lang.id ? null : lang.id)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: selectedLang === lang.id ? `${lang.color}18` : 'var(--bg-card)',
              borderColor: selectedLang === lang.id ? lang.color : 'var(--border)',
              color: selectedLang === lang.id ? lang.color : 'var(--text-muted)',
            }}>{lang.name}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ background: 'var(--bg-card)' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1.5px solid var(--border)' }}>
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👾</div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>No encontramos devs</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Intenta con otro filtro</p>
          </div>
        ) : profiles.map(profile => (
          <Link key={profile.id} href={`/perfil/${profile.username}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', gap: 14, padding: '16px 20px',
              borderBottom: '1.5px solid var(--border)', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{profile.full_name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>@{profile.username} · {profile.city}</p>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, flexShrink: 0,
                    background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                  }}>
                    {LEVEL_LABELS[profile.level]}
                  </span>
                </div>
                {profile.bio && (
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {profile.bio}
                  </p>
                )}
                {profile.user_languages && profile.user_languages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {profile.user_languages
                      .filter(ul => ul.language)
                      .slice(0, 4)
                      .map(({ language }) => (
                        <span key={language.id} style={{
                          fontSize: 11, padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                          color: language.color, border: `1.5px solid ${language.color}50`,
                          background: `${language.color}12`,
                        }}>{language.name}</span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
