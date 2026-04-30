import Link from 'next/link'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Algoritmo de Conexión',
    desc: 'Conectamos con devs compatibles según tu stack, objetivos y lo que buscas. No random, 100% relevante.',
  },
  {
    icon: '💻',
    title: 'Tu Stack Real',
    desc: 'Muestra tus lenguajes con tu nivel real. De aprendiendo a experto, sin mentiras.',
  },
  {
    icon: '🎓',
    title: 'Espacio de Aprendizaje',
    desc: 'Encuentra mentores, compañeros de estudio, y colaboradores para tus proyectos.',
  },
  {
    icon: '📣',
    title: 'Feed tipo X',
    desc: 'Comparte lo que aprendes, tus dudas, tus logros. La comunidad te escucha.',
  },
]

const PREVIEW_DEVS = [
  {
    name: 'Sofía R.',
    lang: 'Python',
    langColor: '#3776AB',
    match: '94%',
    avatarGrad: 'linear-gradient(135deg, #C65D3B, #E87952)',
    avatarColor: '#fff',
  },
  {
    name: 'Andrés M.',
    lang: 'TypeScript',
    langColor: '#3178C6',
    match: '87%',
    avatarGrad: 'linear-gradient(135deg, #D4852A, #F4A847)',
    avatarColor: '#fff',
  },
  {
    name: 'Laura V.',
    lang: 'Kotlin',
    langColor: '#7F52FF',
    match: '81%',
    avatarGrad: 'linear-gradient(135deg, #5A8A57, #8BA888)',
    avatarColor: '#fff',
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
        borderBottom: '1.5px solid var(--border)',
        background: 'rgba(255,251,245,0.92)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="coldev logo"
            width={32}
            height={32}
            style={{ borderRadius: 10, objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>
            col<span style={{ color: 'var(--accent)' }}>dev</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
            Entrar
          </Link>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>
            Únete gratis →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 800, margin: '0 auto',
        padding: 'clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 72px)',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700, color: 'var(--accent-dark)',
          background: 'var(--accent-light)', border: '1.5px solid rgba(232,121,82,0.3)',
          padding: '6px 16px', borderRadius: 999, marginBottom: 32,
          letterSpacing: '0.01em',
        }}>
          🇨🇴 La red social para devs colombianos
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 72px)',
          fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em',
          margin: '0 0 20px',
        }}>
          Conecta con devs{' '}
          <span style={{
            color: 'var(--accent)',
            background: 'linear-gradient(135deg, #E87952, #D96B47)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            que te entienden
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)',
          maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7,
        }}>
          Un algoritmo inteligente te conecta con desarrolladores en Colombia
          según tu stack, nivel, y lo que buscas — mentoría, colaboración o solo aprender.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
            🚀 Crear mi perfil gratis
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ fontSize: 15, padding: '12px 22px' }}>
            Ya tengo cuenta →
          </Link>
        </div>

        {/* Preview cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, maxWidth: 420, margin: '48px auto 0',
        }}>
          {PREVIEW_DEVS.map((dev) => (
            <div key={dev.name} className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', margin: '0 auto 10px',
                background: dev.avatarGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: dev.avatarColor,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>
                {dev.name[0]}
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
                {dev.name}
              </p>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                color: dev.langColor, background: dev.langColor + '18',
                border: `1.5px solid ${dev.langColor}40`, display: 'inline-block',
              }}>
                {dev.lang}
              </span>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 6 }}>
                {dev.match} match ✨
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        borderTop: '1.5px solid var(--border)',
        borderBottom: '1.5px solid var(--border)',
        background: 'var(--bg-secondary)',
        padding: '20px 24px',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(24px, 6vw, 64px)', flexWrap: 'wrap',
        }}>
          {[
            { num: '500+', label: 'Devs colombianos' },
            { num: '12', label: 'Ciudades' },
            { num: '94%', label: 'Match relevante' },
            { num: '100%', label: 'Gratis' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                {s.num}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px' }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, textAlign: 'center',
          marginBottom: 12, letterSpacing: '-0.03em',
        }}>
          ¿Por qué <span style={{ color: 'var(--accent)' }}>coldev</span>?
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 40 }}>
          No es otra red social genérica. Es tuya, dev.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: '24px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 15, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithm */}
      <section style={{
        background: 'var(--bg-secondary)',
        borderTop: '1.5px solid var(--border)',
        borderBottom: '1.5px solid var(--border)',
        padding: 'clamp(40px, 6vw, 72px) 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, textAlign: 'center',
            margin: '0 0 8px', letterSpacing: '-0.03em',
          }}>El algoritmo 🤖</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 36 }}>
            No es random. Cada conexión está calculada.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { pct: '40%', label: 'Lenguajes', desc: 'Stack compartido y niveles complementarios', icon: '💻', color: '#E87952' },
              { pct: '30%', label: 'Objetivos', desc: 'Mentor ↔ Aprendiz, Colaborar ↔ Colaborar', icon: '🎯', color: '#F4A847' },
              { pct: '20%', label: 'Intereses', desc: 'Frontend, IA, Mobile, DevOps...', icon: '✨', color: '#8BA888' },
              { pct: '10%', label: 'Actividad', desc: 'Devs activos que aportan a la comunidad', icon: '🔥', color: '#CE422B' },
            ].map((item) => (
              <div key={item.label} className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: item.color, letterSpacing: '-0.03em', marginBottom: 4 }}>
                  {item.pct}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px' }}>
        <div style={{
          background: 'var(--accent)', borderRadius: 24, padding: 'clamp(32px, 5vw, 56px) 32px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(232,121,82,0.3)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: 'white',
            margin: '0 0 12px', letterSpacing: '-0.03em',
          }}>
            ¿Listo para conectar?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
            Únete a la comunidad de devs colombianos. Es gratis, siempre.
          </p>
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'white', color: 'var(--accent-dark)',
            fontWeight: 800, fontSize: 15, padding: '13px 32px',
            borderRadius: 14, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s',
          }}>
            Crear mi cuenta gratis →
          </Link>
        </div>
      </section>

      <footer style={{
        borderTop: '1.5px solid var(--border)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        coldev 🇨🇴 — Conecta. Comparte. Crece. Para la comunidad dev de Colombia.
      </footer>
    </div>
  )
}
