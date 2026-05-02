'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { IconSend, IconImage } from '@/components/ui/Icons'
import Linkified from '@/components/ui/Linkified'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  image_url: string | null
  created_at: string
}

interface Props {
  conversationId: string
  currentUserId: string
  other: { id: string; username: string; full_name: string; avatar_url: string | null } | null
}

export default function ChatClient({ conversationId, currentUserId, other }: Props) {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial load + polling
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`)
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(data?.error ?? 'No se pudieron cargar los mensajes'); return }
        setMessages(data.messages ?? [])
      } catch {
        if (!cancelled) setError('Error de conexión')
      }
    }
    load()
    const interval = setInterval(load, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [conversationId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function send() {
    const value = text.trim()
    if ((!value && !pendingImage) || sending || uploadingImage) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value, image_url: pendingImage }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? 'No se pudo enviar'); return }
      setMessages((prev) => [...(prev ?? []), data.message])
      setText('')
      setPendingImage(null)
    } catch {
      setError('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return }
    setError(null)
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? 'Error al subir'); return }
      setPendingImage(data.url)
    } catch {
      setError('Error de conexión al subir')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{
      minHeight: '100vh', maxHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      borderRight: '1.5px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1.5px solid var(--border)',
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/mensajes" aria-label="Volver al inbox" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, color: 'var(--text-muted)',
          textDecoration: 'none', fontSize: 18,
        }}>←</Link>
        {other && (
          <Link href={`/perfil/${other.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
            <Avatar src={other.avatar_url} name={other.full_name} size="sm" />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {other.full_name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>@{other.username}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--bg-secondary)',
      }}>
        {messages === null ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
            Cargando…
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14, margin: 0 }}>Sin mensajes todavía. Empieza la conversación.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '76%',
                background: mine ? 'var(--accent)' : 'var(--bg-card)',
                color: mine ? 'white' : 'var(--text)',
                border: mine ? 'none' : '1.5px solid var(--border)',
                borderRadius: 14,
                padding: '8px 12px',
                fontSize: 14, lineHeight: 1.4,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                boxShadow: mine ? '0 2px 8px rgba(232,121,82,0.18)' : 'var(--shadow-sm)',
              }}>
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={m.image_url} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'block', marginBottom: m.content ? 6 : 0 }}>
                    <img src={m.image_url} alt="" style={{
                      maxWidth: '100%', maxHeight: 280, borderRadius: 10, objectFit: 'cover', display: 'block',
                    }} />
                  </a>
                )}
                {m.content && <Linkified text={m.content} />}
              </div>
            )
          })
        )}
      </div>

      {error && (
        <div style={{
          margin: '0 12px 8px', padding: '8px 12px', borderRadius: 8, fontSize: 12,
          background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
        }}>{error}</div>
      )}

      {/* Pending image preview */}
      {pendingImage && (
        <div style={{
          padding: '8px 12px', background: 'var(--bg-card)',
          borderTop: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingImage} alt="" style={{
            width: 56, height: 56, objectFit: 'cover', borderRadius: 10,
            border: '1.5px solid var(--border)',
          }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Imagen lista para enviar</span>
          <button onClick={() => setPendingImage(null)} aria-label="Quitar imagen" style={{
            background: 'none', border: '1.5px solid var(--border)', borderRadius: 8,
            padding: '4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Quitar</button>
        </div>
      )}

      {/* Composer */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px',
        borderTop: '1.5px solid var(--border)', background: 'var(--bg-card)',
        alignItems: 'flex-end',
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleImagePick}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          aria-label="Adjuntar imagen"
          style={{
            background: uploadingImage ? 'var(--accent-light)' : 'var(--bg-secondary)',
            border: '1.5px solid var(--border)', borderRadius: 12,
            padding: '0 12px', height: 40, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: uploadingImage ? 'var(--accent)' : 'var(--text-muted)',
            cursor: uploadingImage ? 'wait' : 'pointer',
          }}
        >
          <IconImage size={18} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Escribe un mensaje..."
          rows={1}
          maxLength={2000}
          style={{
            flex: 1, background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '10px 14px', fontSize: 14, lineHeight: 1.4,
            color: 'var(--text)', fontFamily: 'inherit', resize: 'none', outline: 'none',
            maxHeight: 120,
          }}
        />
        <button
          onClick={send}
          disabled={(!text.trim() && !pendingImage) || sending || uploadingImage}
          aria-label="Enviar"
          style={{
            background: (text.trim() || pendingImage) ? 'var(--accent)' : 'var(--border)',
            border: 'none', borderRadius: 14, padding: '0 16px', height: 40,
            cursor: (text.trim() || pendingImage) && !sending && !uploadingImage ? 'pointer' : 'not-allowed',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: sending ? 0.6 : 1, flexShrink: 0,
          }}
        >
          <IconSend size={18} stroke="white" />
        </button>
      </div>
    </div>
  )
}
