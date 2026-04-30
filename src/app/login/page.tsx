'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message.includes('Invalid login credentials')
        ? 'Correo o contraseña incorrectos'
        : error.message)
      setLoading(false)
      return
    }
    if (data.session) { router.push('/feed'); router.refresh() }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="coldev" width={56} height={56}
            style={{ borderRadius: 16, margin: '0 auto 16px', objectFit: 'contain', display: 'block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Bienvenido de nuevo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>La comunidad dev de Colombia 🇨🇴</p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: 'var(--shadow-md)',
        }}>
          {error && (
            <div style={{
              background: '#FEF2F0', border: '1.5px solid #FCCFBF', borderRadius: 12,
              padding: '12px 16px', color: '#C65D3B', fontSize: 14,
            }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input" placeholder="tu@email.com" required autoComplete="email" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••" required autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary"
            style={{ justifyContent: 'center', marginTop: 4, fontSize: 15 }}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 20 }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Únete gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
