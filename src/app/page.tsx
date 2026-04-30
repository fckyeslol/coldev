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
    <main style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 60,
          borderBottom: '1.5px solid var(--border)',
          background: 'rgba(255,251,245,0.92)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--accent)',
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            CD
          </div>

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

      <section
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 72px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent-dark)',
            background: 'var(--accent-light)',
            border: '1.5px solid rgba(232,121,82,0.3)',
            padding: '6px 16px',
            borderRadius: 999,
            marginBottom: 32,
          }}
        >
          🇨🇴 La red social para devs colombianos
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            margin: '0 0 20px',
          }}
        >
          Conecta con devs{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #E87952, #D96B47)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            que te entienden
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-muted)',
            maxWidth: 520,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          Un algoritmo inteligente te conecta con desarrolladores en Colombia según tu stack, nivel y lo que buscas:
          mentoría, colaboración o solo aprender.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
            🚀 Crear mi perfil gratis
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ fontSize: 15, padding: '12px 22px' }}>
            Ya tengo cuenta →
          </Link>
        </div>
      </section>
    </main>
  )
}