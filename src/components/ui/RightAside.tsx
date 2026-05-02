import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from './Avatar'
import { LEVEL_LABELS, type UserLevel } from '@/types'

interface SuggestedDev {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  level: UserLevel
  city: string
}

const CITIES = ['Cartagena', 'Barranquilla', 'Cúcuta']

export default async function RightAside() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const followingIds: string[] = []
  if (user) {
    const { data: follows } = await supabase
      .from('follows').select('following_id').eq('follower_id', user.id)
    follows?.forEach((f) => followingIds.push(f.following_id))
  }

  let q = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, level, city')
    .eq('is_open_to_connect', true)
    .order('activity_score', { ascending: false })
    .limit(8)
  if (user) q = q.neq('id', user.id)

  const { data: profiles } = await q
  const suggested = ((profiles ?? []) as SuggestedDev[])
    .filter((p) => !followingIds.includes(p.id))
    .slice(0, 4)

  return (
    <aside style={{
      position: 'sticky', top: 16, padding: '8px 16px 16px',
      display: 'flex', flexDirection: 'column', gap: 16,
      maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    }}>
      {/* Foros widget */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)',
          }}>
            Foros nuevos
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-light)', padding: '4px 10px',
            borderRadius: 6, letterSpacing: '0.04em',
          }}>
            CO
          </span>
        </div>
        <p style={{
          margin: '10px 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
        }}>
          Discusiones largas tipo Reddit. Plantea un tema, vota, debate con devs.
        </p>
        <Link
          href="/foros"
          className="btn btn-primary"
          style={{
            width: '100%', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
            padding: '12px 16px', borderRadius: 12,
          }}
        >
          Explorar foros →
        </Link>

        {/* Cities */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: '1.5px solid var(--border)',
        }}>
          <p style={{
            margin: '0 0 10px', fontSize: 11, fontWeight: 700,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            Únete en
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CITIES.map((c) => (
              <span key={c} style={{
                fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '6px 14px', borderRadius: 8,
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested devs */}
      {suggested.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '16px 18px 8px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{
            margin: '0 0 12px', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}>
            Devs para conectar
          </p>
          {suggested.map((p) => (
            <Link
              key={p.id}
              href={`/perfil/${p.username}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 4px', textDecoration: 'none', color: 'inherit',
                borderRadius: 8,
              }}
            >
              <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 13, fontWeight: 700,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.full_name}
                </p>
                <p style={{
                  margin: 0, fontSize: 11, color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  @{p.username} · {LEVEL_LABELS[p.level] ?? p.level}
                </p>
              </div>
            </Link>
          ))}
          <Link href="/explore" style={{
            display: 'block', padding: '10px 4px 6px', fontSize: 12, color: 'var(--accent)',
            fontWeight: 700, textDecoration: 'none', textAlign: 'center',
          }}>
            Ver más →
          </Link>
        </div>
      )}
    </aside>
  )
}
