import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Forum {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

export default async function ForosIndexPage() {
  const supabase = await createClient()
  const { data: forums } = await supabase
    .from('forums')
    .select('id, slug, name, description, icon, color')
    .order('id', { ascending: true })

  const list = (forums ?? []) as Forum[]

  return (
    <div style={{ minHeight: '100vh', borderRight: '1.5px solid var(--border)' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,251,245,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid var(--border)', padding: '14px 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
          Foros 🗣️
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Discusiones largas sobre programación. Vota, comenta, conecta.
        </p>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {list.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 700 }}>Aún no hay foros configurados</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Corre <code>supabase/migrations/coldev_forums.sql</code>.
            </p>
          </div>
        ) : (
          list.map((f) => (
            <Link
              key={f.id}
              href={`/foros/${f.slug}`}
              className="card"
              style={{
                padding: 16, textDecoration: 'none', color: 'inherit',
                display: 'flex', flexDirection: 'column', gap: 8,
                borderTop: `3px solid ${f.color ?? 'var(--accent)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 22, width: 38, height: 38, borderRadius: 10,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: `${f.color ?? '#E87952'}18`,
                }}>
                  {f.icon ?? '💬'}
                </span>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
                  {f.name}
                </p>
              </div>
              {f.description && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {f.description}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
