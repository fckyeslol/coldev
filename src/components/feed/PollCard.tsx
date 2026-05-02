'use client'

import { useState } from 'react'
import type { Poll, PollOption } from '@/types'

interface Props {
  poll: Poll
}

export default function PollCard({ poll }: Props) {
  const [options, setOptions] = useState<PollOption[]>(poll.options ?? [])
  const [myVote, setMyVote] = useState<string | null>(poll.my_vote ?? null)
  const [voting, setVoting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = options.reduce((s, o) => s + (o.votes_count ?? 0), 0)
  const closed = poll.closes_at ? new Date(poll.closes_at).getTime() < Date.now() : false

  async function vote(optionId: string) {
    if (closed || voting) return
    setVoting(optionId)
    setError(null)
    const prevVote = myVote
    setMyVote(optionId)
    // Optimistic count update
    setOptions((prev) => prev.map((o) => {
      if (o.id === optionId) return { ...o, votes_count: o.votes_count + (prevVote === optionId ? 0 : 1) }
      if (prevVote && o.id === prevVote) return { ...o, votes_count: Math.max(0, o.votes_count - 1) }
      return o
    }))
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo votar')
        setMyVote(prevVote)
        return
      }
      // Reconcile with server tallies
      if (Array.isArray(data.options)) setOptions(data.options)
    } catch {
      setError('Error de conexión')
      setMyVote(prevVote)
    } finally {
      setVoting(null)
    }
  }

  return (
    <div style={{
      marginTop: 12, border: '1.5px solid var(--border)', borderRadius: 12,
      padding: 12, background: 'var(--bg-secondary)',
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
        {poll.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((o) => {
          const pct = total > 0 ? Math.round((o.votes_count / total) * 100) : 0
          const isMine = myVote === o.id
          const disabled = !!voting || closed
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              disabled={disabled}
              style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${isMine ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--bg-card)',
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: 'inherit',
                color: 'var(--text)',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Bar fill */}
              <span aria-hidden style={{
                position: 'absolute', inset: 0,
                background: isMine ? 'var(--accent-light)' : 'var(--bg-hover)',
                width: `${pct}%`, transition: 'width 0.3s',
                pointerEvents: 'none',
              }} />
              <span style={{ position: 'relative', fontSize: 13, fontWeight: isMine ? 700 : 500 }}>
                {isMine && '✓ '}{o.text}
              </span>
              <span style={{ position: 'relative', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {pct}% · {o.votes_count}
              </span>
            </button>
          )
        })}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
        {total} {total === 1 ? 'voto' : 'votos'}{closed ? ' · cerrada' : ''}
        {error && <span style={{ marginLeft: 8, color: '#C65D3B', fontWeight: 600 }}>· {error}</span>}
      </p>
    </div>
  )
}
