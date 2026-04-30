'use client'

import { useState, useRef } from 'react'
import type { Post, Profile } from '@/types'
import Avatar from '@/components/ui/Avatar'
import { IconImage, IconBarChart, IconLink } from '@/components/ui/Icons'

const QUICK_LANGS = [
  { id: 1, name: 'JS',     color: '#F7DF1E' },
  { id: 2, name: 'TS',     color: '#3178C6' },
  { id: 3, name: 'Python', color: '#3776AB' },
  { id: 4, name: 'Java',   color: '#ED8B00' },
  { id: 5, name: 'Kotlin', color: '#7F52FF' },
  { id: 7, name: 'Go',     color: '#00ADD8' },
  { id: 8, name: 'Rust',   color: '#CE422B' },
  { id: 9, name: 'C#',     color: '#239120' },
]

interface Props {
  profile: Profile
  onPost: (post: Post) => void
}

export default function ComposeBox({ profile, onPost }: Props) {
  const [content, setContent] = useState('')
  const [selectedLangs, setSelectedLangs] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')

  // Link insert state
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  const remaining = 280 - content.length
  const canPost = content.trim().length > 0 && !loading && !imageUploading

  function toggleLang(id: number) {
    setSelectedLangs(p => p.includes(id) ? p.filter(l => l !== id) : [...p, id])
  }

  function handleImageClick() {
    fileInputRef.current?.click()
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError('')
    if (!file.type.startsWith('image/')) { setImageError('Solo se permiten imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setImageError('Máximo 5MB'); return }

    // Preview
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload immediately
    setImageUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setImageError(data.error ?? 'Error al subir imagen'); removeImage(); return }
      setImageUrl(data.url)
    } catch {
      setImageError('Error de conexión al subir imagen')
      removeImage()
    } finally {
      setImageUploading(false)
    }
    // Reset input so the same file can be reselected
    e.target.value = ''
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    setImageError('')
    setImageUploading(false)
  }

  function handleLinkInsert() {
    if (!linkValue.trim()) { setShowLinkInput(false); return }
    const url = linkValue.startsWith('http') ? linkValue : `https://${linkValue}`
    setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + url)
    setLinkValue('')
    setShowLinkInput(false)
  }

  async function handlePost() {
    if (!canPost) return
    setLoading(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language_tags: selectedLangs,
          image_url: imageUrl ?? undefined,
        }),
      })
      if (res.ok) {
        const { post } = await res.json()
        post.profile = profile
        post.has_liked = false
        post.image_url = imageUrl
        onPost(post)
        setContent('')
        setSelectedLangs([])
        setFocused(false)
        removeImage()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1.5px solid var(--border)',
      background: 'var(--bg-card)',
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="¿Qué estás aprendiendo hoy?"
            maxLength={280}
            rows={focused ? 3 : 2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />

          {/* Language pills */}
          {focused && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {QUICK_LANGS.map(lang => (
                <button key={lang.id} type="button" onClick={() => toggleLang(lang.id)} style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                  cursor: 'pointer', border: `1.5px solid ${selectedLangs.includes(lang.id) ? lang.color : 'var(--border)'}`,
                  background: selectedLangs.includes(lang.id) ? `${lang.color}18` : 'transparent',
                  color: selectedLangs.includes(lang.id) ? lang.color : 'var(--text-muted)',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {lang.name}
                </button>
              ))}
            </div>
          )}

          {/* Link input */}
          {showLinkInput && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 12,
              padding: '8px 12px', borderRadius: 10,
              background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
            }}>
              <input
                type="url"
                value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                placeholder="https://..."
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleLinkInsert(); if (e.key === 'Escape') setShowLinkInput(false) }}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleLinkInsert}
                style={{
                  background: 'var(--accent)', color: 'white', border: 'none',
                  borderRadius: 7, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Insertar
              </button>
              <button
                onClick={() => { setShowLinkInput(false); setLinkValue('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 18, padding: '0 4px',
                }}
              >×</button>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div style={{ position: 'relative', marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
              {imageUploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 13, fontWeight: 600,
                }}>
                  Subiendo...
                </div>
              )}
              <button
                onClick={removeImage}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                  borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, lineHeight: 1,
                }}
              >×</button>
            </div>
          )}

          {imageError && (
            <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 8px', fontWeight: 600 }}>{imageError}</p>
          )}

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1.5px solid var(--border)', paddingTop: 12,
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {/* Image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <ToolBtn
                icon={<IconImage size={18} />}
                label="Imagen"
                onClick={handleImageClick}
                active={!!imagePreview}
              />
              {/* Poll placeholder */}
              <ToolBtn
                icon={<IconBarChart size={18} />}
                label="Encuesta"
                onClick={() => {}}
              />
              {/* Link */}
              <ToolBtn
                icon={<IconLink size={18} />}
                label="Enlace"
                onClick={() => { setShowLinkInput(s => !s); setFocused(true) }}
                active={showLinkInput}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {content.length > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: remaining < 20 ? '#DC2626' : 'var(--text-muted)',
                }}>
                  {remaining}
                </span>
              )}
              <button
                onClick={handlePost}
                disabled={!canPost}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px', fontSize: 14,
                  opacity: canPost ? 1 : 0.4,
                  cursor: canPost ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? '...' : imageUploading ? 'Subiendo...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      style={{
        background: active ? 'var(--accent-light)' : 'none',
        border: 'none', cursor: 'pointer',
        padding: '6px', borderRadius: 8,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)' }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
          ;(e.currentTarget as HTMLElement).style.background = 'none'
        }
      }}
    >
      {icon}
    </button>
  )
}
