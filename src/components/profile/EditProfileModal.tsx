'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { City, Profile, UserLevel } from '@/types'
import { LEVEL_LABELS } from '@/types'
import Avatar from '@/components/ui/Avatar'

const CITIES: City[] = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'otra']
const LEVELS: UserLevel[] = ['aprendiendo', 'junior', 'mid', 'senior', 'experto']

interface Props {
  profile: Profile
  onClose: () => void
}

export default function EditProfileModal({ profile, onClose }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [city, setCity] = useState<City>(profile.city ?? 'Bogotá')
  const [level, setLevel] = useState<UserLevel>(profile.level ?? 'junior')
  const [github, setGithub] = useState(profile.github_url ?? '')
  const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? '')
  const [website, setWebsite] = useState(profile.website_url ?? '')
  const [openToConnect, setOpenToConnect] = useState(profile.is_open_to_connect ?? true)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')

  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return }
    setError(null)
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al subir avatar'); return }
      setAvatarUrl(data.url)
    } catch {
      setError('Error de conexión al subir avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (saving) return
    if (!fullName.trim()) { setError('El nombre no puede estar vacío'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          bio: bio.trim(),
          city,
          level,
          github_url: github.trim() || null,
          linkedin_url: linkedin.trim() || null,
          website_url: website.trim() || null,
          is_open_to_connect: openToConnect,
          avatar_url: avatarUrl || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error ?? 'No se pudo guardar'); return }
      onClose()
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(45, 38, 33, 0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, background: 'var(--bg-card)',
          borderRadius: 16, border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1.5px solid var(--border)',
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Editar perfil
          </h2>
          <button onClick={onClose} aria-label="Cerrar" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-muted)', padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar src={avatarUrl || null} name={fullName || profile.full_name} size="xl" />
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: '1.5px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text)', cursor: uploadingAvatar ? 'wait' : 'pointer',
            }}>
              {uploadingAvatar ? 'Subiendo...' : 'Cambiar avatar'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <Field label="Nombre completo">
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={80} />
          </Field>

          <Field label={`Bio (${bio.length}/160)`}>
            <textarea
              className="input"
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 160))}
              rows={3}
              style={{ resize: 'none' }}
              placeholder="Cuéntanos qué te apasiona..."
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Ciudad">
              <select className="input" value={city} onChange={e => setCity(e.target.value as City)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Nivel">
              <select className="input" value={level} onChange={e => setLevel(e.target.value as UserLevel)}>
                {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </Field>
          </div>

          <Field label="GitHub URL">
            <input className="input" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/usuario" />
          </Field>
          <Field label="LinkedIn URL">
            <input className="input" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/usuario" />
          </Field>
          <Field label="Website">
            <input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://tu-sitio.com" />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={openToConnect}
              onChange={e => setOpenToConnect(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <span>Estoy abierto a conectar con otros devs</span>
          </label>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 10, fontSize: 13,
              background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
            }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '14px 20px', borderTop: '1.5px solid var(--border)',
        }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: 13 }}>Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingAvatar}
            className="btn btn-primary"
            style={{ fontSize: 13, opacity: saving || uploadingAvatar ? 0.6 : 1 }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
