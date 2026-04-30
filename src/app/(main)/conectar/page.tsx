'use client'

import { useEffect, useState } from 'react'
import type { MatchedProfile } from '@/types'
import DevCard from '@/components/profile/DevCard'

const FILTERS = [
  { key: 'todos',    label: '🌐 Todos' },
  { key: 'mentores', label: '🧑‍🏫 Mentores' },
  { key: 'colaborar',label: '🤝 Colaborar' },
  { key: 'aprender', label: '📚 Aprender' },
] as const

export default function ConectarPage() {
  const [matches, setMatches] = useState<MatchedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof FILTERS[number]['key']>('todos')

  useEffect(() => {
    fetch('/api/match').then(r => r.json())
      .then(({ matches }) => { setMatches(matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = matches.filter(m => {
    if (filter === 'todos') return true
    if (filter === 'mentores') return m.user_goals?.some(g => g.goal === 'mentoring_dar')
    if (filter === 'colaborar') return m.user_goals?.some(g => g.goal === 'colaborar')
    if (filter === 'aprender') return m.user_goals?.some(g => g.goal === 'aprender_juntos')
    return true
  })

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Conectar ⚡</h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Devs perfectos para ti según el algoritmo
        </p>
      </div>

      {/* Algorithm banner */}
      <div style={{
        margin: 16, padding: 16, borderRadius: 16,
        background: 'var(--accent-light)', border: '1.5px solid var(--accent)',
      }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)' }}>
          ¿Cómo funciona el algoritmo? 🤖
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: '💻', pct: '40%', label: 'Lenguajes' },
            { icon: '🎯', pct: '30%', label: 'Objetivos' },
            { icon: '✨', pct: '20%', label: 'Intereses' },
            { icon: '🔥', pct: '10%', label: 'Actividad' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg-card)', borderRadius: 12, padding: '10px 8px',
              textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>{item.pct}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto',
        borderBottom: '1.5px solid var(--border)',
      }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: '1.5px solid', fontFamily: 'inherit', transition: 'all 0.15s',
            background: filter === f.key ? 'var(--accent)' : 'var(--bg-card)',
            borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
            color: filter === f.key ? 'white' : 'var(--text-muted)',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>No hay matches todavía</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
              Completa tu perfil para mejorar los resultados
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>
              {filtered.length} devs compatibles encontrados ✨
            </p>
            {filtered.map(dev => <DevCard key={dev.id} dev={dev} />)}
          </>
        )}
      </div>
    </div>
  )
}
