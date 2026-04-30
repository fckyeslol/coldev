'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { City, Goal, Profile, Proficiency, UserLevel } from '@/types'
import { GOAL_ICONS, GOAL_LABELS, LEVEL_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

const LANGUAGES = [
  { id: 1,  name: 'JavaScript', color: '#F7DF1E' },
  { id: 2,  name: 'TypeScript', color: '#3178C6' },
  { id: 3,  name: 'Python',     color: '#3776AB' },
  { id: 4,  name: 'Java',       color: '#ED8B00' },
  { id: 5,  name: 'Kotlin',     color: '#7F52FF' },
  { id: 6,  name: 'Swift',      color: '#F05138' },
  { id: 7,  name: 'Go',         color: '#00ADD8' },
  { id: 8,  name: 'Rust',       color: '#CE422B' },
  { id: 9,  name: 'C#',         color: '#239120' },
  { id: 10, name: 'C++',        color: '#00599C' },
  { id: 11, name: 'PHP',        color: '#777BB4' },
  { id: 12, name: 'Ruby',       color: '#CC342D' },
  { id: 13, name: 'Dart',       color: '#0175C2' },
  { id: 14, name: 'SQL',        color: '#336791' },
]

const TOPICS = [
  { id: 1,  name: 'Frontend',       icon: '🎨' },
  { id: 2,  name: 'Backend',        icon: '⚙️' },
  { id: 3,  name: 'Mobile',         icon: '📱' },
  { id: 4,  name: 'DevOps',         icon: '🚀' },
  { id: 5,  name: 'AI/ML',          icon: '🤖' },
  { id: 6,  name: 'Seguridad',      icon: '🔒' },
  { id: 7,  name: 'Blockchain',     icon: '⛓️' },
  { id: 8,  name: 'Bases de Datos', icon: '🗄️' },
  { id: 9,  name: 'Cloud',          icon: '☁️' },
  { id: 10, name: 'Open Source',    icon: '🌐' },
  { id: 11, name: 'Juegos',         icon: '🎮' },
  { id: 12, name: 'Diseño UI/UX',   icon: '✏️' },
]

const ALL_GOALS: Goal[] = [
  'mentoring_dar', 'mentoring_recibir', 'colaborar',
  'networking', 'aprender_juntos', 'conseguir_trabajo', 'contratar',
]

const PROFICIENCIES: { value: Proficiency; label: string; emoji: string }[] = [
  { value: 'aprendiendo', label: 'Aprendiendo', emoji: '📖' },
  { value: 'cómodo',      label: 'Cómodo',       emoji: '✨' },
  { value: 'experto',     label: 'Experto',       emoji: '⚡' },
]

const CITIES: City[] = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'otra']
const LEVELS: UserLevel[] = ['aprendiendo', 'junior', 'mid', 'senior', 'experto']

type Tab = 'perfil' | 'stack' | 'buscando' | 'intereses'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'perfil',    label: 'Perfil',     emoji: '👤' },
  { id: 'stack',     label: 'Stack',      emoji: '💻' },
  { id: 'buscando',  label: 'Buscando',   emoji: '🎯' },
  { id: 'intereses', label: 'Intereses',  emoji: '✨' },
]

interface Props {
  profile: Profile
  onClose: () => void
}

export default function EditProfileModal({ profile, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('perfil')

  // Basic profile fields
  const [fullName, setFullName]       = useState(profile.full_name ?? '')
  const [bio, setBio]                 = useState(profile.bio ?? '')
  const [city, setCity]               = useState<City>(profile.city ?? 'Bogotá')
  const [level, setLevel]             = useState<UserLevel>(profile.level ?? 'junior')
  const [github, setGithub]           = useState(profile.github_url ?? '')
  const [linkedin, setLinkedin]       = useState(profile.linkedin_url ?? '')
  const [website, setWebsite]         = useState(profile.website_url ?? '')
  const [openToConnect, setOpenToConnect] = useState(profile.is_open_to_connect ?? true)
  const [avatarUrl, setAvatarUrl]     = useState(profile.avatar_url ?? '')

  // Stack
  const [selectedLangs, setSelectedLangs] = useState<Map<number, Proficiency>>(
    () => new Map((profile.user_languages ?? []).map((ul) => [ul.language.id, ul.proficiency]))
  )

  // Goals
  const [goals, setGoals] = useState<Set<Goal>>(
    () => new Set((profile.user_goals ?? []).map((g) => g.goal))
  )

  // Interests
  const [interests, setInterests] = useState<Set<number>>(
    () => new Set((profile.user_interests ?? []).map((ui) => ui.topic.id))
  )

  const [saving, setSaving]               = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  function toggleLang(id: number) {
    setSelectedLangs((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, 'aprendiendo')
      return next
    })
  }

  function setLangProf(id: number, prof: Proficiency) {
    setSelectedLangs((prev) => new Map(prev).set(id, prof))
  }

  function toggleGoal(goal: Goal) {
    setGoals((prev) => {
      const next = new Set(prev)
      if (next.has(goal)) next.delete(goal)
      else next.add(goal)
      return next
    })
  }

  function toggleInterest(id: number) {
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          full_name:        fullName.trim(),
          bio:              bio.trim(),
          city,
          level,
          github_url:       github.trim()   || null,
          linkedin_url:     linkedin.trim() || null,
          website_url:      website.trim()  || null,
          is_open_to_connect: openToConnect,
          avatar_url:       avatarUrl || null,
          languages: Array.from(selectedLangs.entries()).map(([language_id, proficiency]) => ({
            language_id,
            proficiency,
          })),
          goals:     Array.from(goals),
          interests: Array.from(interests),
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
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(45,38,33,0.55)', backdropFilter: 'blur(4px)', padding: '32px 16px 40px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-fade-in"
        style={{ maxWidth: 520, background: 'var(--bg-card)', borderRadius: 20, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[17px] font-black tracking-tight">Editar perfil</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] text-xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)] px-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-[13px] font-semibold border-b-2 transition-colors -mb-px',
                tab === t.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5">

          {/* ── Tab: Perfil ── */}
          {tab === 'perfil' && (
            <div className="flex flex-col gap-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar src={avatarUrl || null} name={fullName || profile.full_name} size="xl" />
                <label className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] transition-colors',
                  uploadingAvatar ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]'
                )}>
                  {uploadingAvatar ? 'Subiendo...' : '📷 Cambiar avatar'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>

              <Field label="Nombre completo">
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
              </Field>

              <Field label={`Bio (${bio.length}/160)`}>
                <textarea
                  className="input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  rows={3}
                  style={{ resize: 'none' }}
                  placeholder="Cuéntanos qué te apasiona..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad">
                  <select className="input" value={city} onChange={(e) => setCity(e.target.value as City)}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Nivel">
                  <select className="input" value={level} onChange={(e) => setLevel(e.target.value as UserLevel)}>
                    {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="GitHub URL">
                <input className="input" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/usuario" />
              </Field>
              <Field label="LinkedIn URL">
                <input className="input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/usuario" />
              </Field>
              <Field label="Website">
                <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://tu-sitio.com" />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setOpenToConnect((v) => !v)}
                  className={cn(
                    'w-10 h-6 rounded-full flex-shrink-0 transition-colors relative cursor-pointer',
                    openToConnect ? 'bg-[var(--green)]' : 'bg-[var(--border-hover)]'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    openToConnect ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </div>
                <span className="text-[14px]">Estoy abierto a conectar con otros devs</span>
              </label>
            </div>
          )}

          {/* ── Tab: Stack ── */}
          {tab === 'stack' && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[var(--text-muted)]">
                Selecciona los lenguajes que usas. Toca uno para elegir tu nivel.
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const selected = selectedLangs.has(lang.id)
                  return (
                    <button
                      key={lang.id}
                      onClick={() => toggleLang(lang.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all',
                        selected ? 'scale-105' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      )}
                      style={selected ? { color: lang.color, borderColor: lang.color, background: `${lang.color}18` } : {}}
                    >
                      {lang.name}
                    </button>
                  )
                })}
              </div>

              {selectedLangs.size > 0 && (
                <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                  <p className="text-[12px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Nivel por lenguaje</p>
                  {Array.from(selectedLangs.entries()).map(([id, prof]) => {
                    const lang = LANGUAGES.find((l) => l.id === id)!
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <span className="text-[13px] font-semibold w-24 truncate flex-shrink-0" style={{ color: lang.color }}>
                          {lang.name}
                        </span>
                        <div className="flex gap-1 flex-1">
                          {PROFICIENCIES.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setLangProf(id, p.value)}
                              className={cn(
                                'flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all',
                                prof === p.value
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                              )}
                            >
                              {p.emoji} {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedLangs.size === 0 && (
                <p className="text-center text-[13px] text-[var(--text-dim)] py-4">
                  Toca un lenguaje para añadirlo a tu stack
                </p>
              )}
            </div>
          )}

          {/* ── Tab: Buscando ── */}
          {tab === 'buscando' && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[var(--text-muted)]">
                Dile al algoritmo qué buscas — conectamos con quien complementa tus objetivos.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      goals.has(goal)
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <span className="text-xl block mb-1">{GOAL_ICONS[goal]}</span>
                    <span className="text-[12px] font-semibold leading-tight block">{GOAL_LABELS[goal]}</span>
                  </button>
                ))}
              </div>
              {goals.size === 0 && (
                <p className="text-center text-[13px] text-[var(--text-dim)] py-2">
                  Selecciona al menos un objetivo
                </p>
              )}
            </div>
          )}

          {/* ── Tab: Intereses ── */}
          {tab === 'intereses' && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[var(--text-muted)]">
                Selecciona los temas que más te apasionan.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => toggleInterest(topic.id)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all',
                      interests.has(topic.id)
                        ? 'border-[var(--green)] text-[var(--green)]'
                        : 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}
                    style={interests.has(topic.id) ? { background: '#EEF4ED' } : {}}
                  >
                    <span className="text-2xl block mb-1">{topic.icon}</span>
                    <span className="text-[11px] font-semibold leading-tight block">{topic.name}</span>
                  </button>
                ))}
              </div>
              {interests.size === 0 && (
                <p className="text-center text-[13px] text-[var(--text-dim)] py-2">
                  Selecciona al menos un tema
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 px-3 py-2.5 rounded-xl text-[13px] bg-[#FEF2F0] border border-[#FCCFBF] text-[#C65D3B]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: 13 }}>
            Cancelar
          </button>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.04em]">
        {label}
      </span>
      {children}
    </label>
  )
}
