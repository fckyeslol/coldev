'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { City, Goal, OnboardingData, Proficiency, UserLevel } from '@/types'
import { GOAL_ICONS, GOAL_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { id: 1, name: 'JavaScript', color: '#F7DF1E' },
  { id: 2, name: 'TypeScript', color: '#3178C6' },
  { id: 3, name: 'Python', color: '#3776AB' },
  { id: 4, name: 'Java', color: '#ED8B00' },
  { id: 5, name: 'Kotlin', color: '#7F52FF' },
  { id: 6, name: 'Swift', color: '#F05138' },
  { id: 7, name: 'Go', color: '#00ADD8' },
  { id: 8, name: 'Rust', color: '#CE422B' },
  { id: 9, name: 'C#', color: '#239120' },
  { id: 10, name: 'C++', color: '#00599C' },
  { id: 11, name: 'PHP', color: '#777BB4' },
  { id: 12, name: 'Ruby', color: '#CC342D' },
  { id: 13, name: 'Dart', color: '#0175C2' },
  { id: 14, name: 'SQL', color: '#336791' },
]

const TOPICS = [
  { id: 1, name: 'Frontend', icon: '🎨' },
  { id: 2, name: 'Backend', icon: '⚙️' },
  { id: 3, name: 'Mobile', icon: '📱' },
  { id: 4, name: 'DevOps', icon: '🚀' },
  { id: 5, name: 'AI/ML', icon: '🤖' },
  { id: 6, name: 'Seguridad', icon: '🔒' },
  { id: 7, name: 'Blockchain', icon: '⛓️' },
  { id: 8, name: 'Bases de Datos', icon: '🗄️' },
  { id: 9, name: 'Cloud', icon: '☁️' },
  { id: 10, name: 'Open Source', icon: '🌐' },
  { id: 11, name: 'Juegos', icon: '🎮' },
  { id: 12, name: 'Diseño UI/UX', icon: '✏️' },
]

const LEVELS: { value: UserLevel; label: string; desc: string }[] = [
  { value: 'aprendiendo', label: '🌱 Aprendiendo', desc: 'Empezando mi camino' },
  { value: 'junior', label: '⚡ Junior', desc: 'Menos de 2 años de experiencia' },
  { value: 'mid', label: '🔥 Mid', desc: '2-4 años de experiencia' },
  { value: 'senior', label: '🚀 Senior', desc: '4+ años de experiencia' },
  { value: 'experto', label: '💎 Experto', desc: 'Referente en mi área' },
]

const GOALS: Goal[] = ['mentoring_dar', 'mentoring_recibir', 'colaborar', 'networking', 'aprender_juntos', 'conseguir_trabajo', 'contratar']
const CITIES: City[] = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'otra']
const PROFICIENCIES: { value: Proficiency; label: string; emoji: string }[] = [
  { value: 'aprendiendo', label: 'Aprendiendo', emoji: '📖' },
  { value: 'cómodo', label: 'Cómodo', emoji: '✨' },
  { value: 'experto', label: 'Experto', emoji: '⚡' },
]

const TOTAL_STEPS = 5

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0: Auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 1: Basic info
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState<City>('Bogotá')
  const [bio, setBio] = useState('')

  // Step 2: Level
  const [level, setLevel] = useState<UserLevel>('junior')

  // Step 3: Languages
  const [selectedLangs, setSelectedLangs] = useState<Map<number, Proficiency>>(new Map())

  // Step 4: Goals
  const [goals, setGoals] = useState<Set<Goal>>(new Set())

  // Step 5: Interests
  const [interests, setInterests] = useState<Set<number>>(new Set())

  function toggleLang(id: number) {
    setSelectedLangs((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, 'aprendiendo')
      return next
    })
  }

  function setLangProficiency(id: number, prof: Proficiency) {
    setSelectedLangs((prev) => {
      const next = new Map(prev)
      next.set(id, prof)
      return next
    })
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

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    // 1. Check username availability first
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (existingUser) {
      setError('Ese @username ya está en uso, elige otro')
      setLoading(false)
      return
    }

    // 2. Create auth user (or get existing session)
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Este correo ya tiene cuenta. ¿Quieres iniciar sesión?')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }
    if (!authData.user) {
      setError('Error al crear la cuenta, intenta de nuevo')
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // 3. Upsert profile (handles repeated sign-up attempts)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      full_name: fullName,
      city,
      bio,
      level,
    })
    if (profileError) {
      setError(`Error al crear perfil: ${profileError.message}`)
      setLoading(false)
      return
    }

    // 3. Insert languages
    if (selectedLangs.size > 0) {
      await supabase.from('user_languages').insert(
        Array.from(selectedLangs.entries()).map(([language_id, proficiency]) => ({
          user_id: userId,
          language_id,
          proficiency,
        }))
      )
    }

    // 4. Insert goals
    if (goals.size > 0) {
      await supabase.from('user_goals').insert(
        Array.from(goals).map((goal) => ({ user_id: userId, goal }))
      )
    }

    // 5. Insert interests
    if (interests.size > 0) {
      await supabase.from('user_interests').insert(
        Array.from(interests).map((topic_id) => ({ user_id: userId, topic_id }))
      )
    }

    router.push('/feed')
  }

  const progress = ((step + 1) / (TOTAL_STEPS + 1)) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="coldev" width={48} height={48}
            className="rounded-xl mx-auto mb-3 object-contain" />
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">Paso {step + 1} de {TOTAL_STEPS + 1}</p>
        </div>

        <div className="card p-6 animate-fade-in">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3 mb-4">
              {error}
            </div>
          )}

          {/* Step 0: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">Crear tu cuenta</h2>
                <p className="text-[var(--text-muted)] text-sm">La comunidad dev más chévere de Colombia 🇨🇴</p>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="Correo electrónico" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="Contraseña (mín. 8 caracteres)" />
              <button onClick={() => email && password.length >= 8 && setStep(1)}
                className="btn btn-primary w-full justify-center">
                Continuar →
              </button>
              <p className="text-center text-sm text-[var(--text-muted)]">
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="text-[var(--accent)] font-semibold">Entra aquí</a>
              </p>
            </div>
          )}

          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">Cuéntanos sobre ti</h2>
                <p className="text-[var(--text-muted)] text-sm">¿Cómo te conocerán los demás devs?</p>
              </div>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="input" placeholder="Tu nombre completo" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="input pl-8" placeholder="username" />
              </div>
              <select value={city} onChange={(e) => setCity(e.target.value as City)}
                className="input appearance-none">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                className="input resize-none" rows={3}
                placeholder="Una bio corta... ¿qué te apasiona? (opcional)" maxLength={160} />
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn btn-secondary flex-1 justify-center">← Atrás</button>
                <button onClick={() => fullName && username && setStep(2)}
                  className="btn btn-primary flex-1 justify-center">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">¿En qué nivel estás?</h2>
                <p className="text-[var(--text-muted)] text-sm">Esto ayuda al algoritmo a conectarte mejor</p>
              </div>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <button key={l.value} onClick={() => setLevel(l.value)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all',
                      level === l.value
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text)]'
                        : 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}>
                    <div className="font-semibold text-sm">{l.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{l.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn btn-secondary flex-1 justify-center">← Atrás</button>
                <button onClick={() => setStep(3)} className="btn btn-primary flex-1 justify-center">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 3: Languages */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">Tu stack 💻</h2>
                <p className="text-[var(--text-muted)] text-sm">
                  Selecciona los lenguajes que usas. Toca uno para ajustar tu nivel.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const selected = selectedLangs.has(lang.id)
                  return (
                    <button key={lang.id} onClick={() => toggleLang(lang.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all',
                        selected
                          ? 'scale-105'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      )}
                      style={selected ? {
                        color: lang.color,
                        borderColor: lang.color,
                        background: `${lang.color}18`,
                      } : {}}>
                      {lang.name}
                    </button>
                  )
                })}
              </div>

              {/* Proficiency for selected langs */}
              {selectedLangs.size > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] font-medium">Nivel por lenguaje:</p>
                  {Array.from(selectedLangs.entries()).map(([id, prof]) => {
                    const lang = LANGUAGES.find((l) => l.id === id)!
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-24 truncate" style={{ color: lang.color }}>
                          {lang.name}
                        </span>
                        <div className="flex gap-1 flex-1">
                          {PROFICIENCIES.map((p) => (
                            <button key={p.value} onClick={() => setLangProficiency(id, p.value)}
                              className={cn(
                                'flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-all',
                                prof === p.value
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                              )}>
                              {p.emoji} {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn btn-secondary flex-1 justify-center">← Atrás</button>
                <button onClick={() => setStep(4)} className="btn btn-primary flex-1 justify-center">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">¿Qué buscas? 🎯</h2>
                <p className="text-[var(--text-muted)] text-sm">
                  Esto es la clave del algoritmo — conectamos con quien complementa tus objetivos.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((goal) => (
                  <button key={goal} onClick={() => toggleGoal(goal)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      goals.has(goal)
                        ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-hover)]'
                    )}>
                    <span className="text-xl block mb-1">{GOAL_ICONS[goal]}</span>
                    <span className="text-xs font-semibold">{GOAL_LABELS[goal]}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn btn-secondary flex-1 justify-center">← Atrás</button>
                <button onClick={() => goals.size > 0 && setStep(5)} className="btn btn-primary flex-1 justify-center">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 5: Interests */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-1">¿Qué te apasiona? ✨</h2>
                <p className="text-[var(--text-muted)] text-sm">Selecciona los temas que más te interesan</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TOPICS.map((topic) => (
                  <button key={topic.id} onClick={() => toggleInterest(topic.id)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all',
                      interests.has(topic.id)
                        ? 'border-[var(--green)] bg-[var(--green-glow)] text-[var(--green)]'
                        : 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}>
                    <span className="text-2xl block mb-1">{topic.icon}</span>
                    <span className="text-xs font-medium">{topic.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="btn btn-secondary flex-1 justify-center">← Atrás</button>
                <button onClick={handleSubmit} disabled={loading || interests.size === 0}
                  className="btn btn-primary flex-1 justify-center">
                  {loading ? 'Creando perfil...' : '🚀 Entrar a coldev'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
