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

export default async function RightAside() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Suggested devs: top by activity, excluding self + already-followed.
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
    .slice(0, 5)

  return (
    <aside style={{
      position: 'sticky', top: 16, padding: '8px 16px 16px',
      display: 'flex', flexDirection: 'column', gap: 16,
      maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    }}>
      {/* Foros CTA */}
      <div className="card" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>
          🗣️ Foros nuevos
        </p>
        <p style={{ margin: '6px 0 12px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Discusiones largas tipo Reddit. Plantea un tema, vota, debate con devs.
        </p>
        <Link href="/foros" className="btn btn-primary" style={{
          width: '100%', justifyContent: 'center', fontSize: 13, padding: '8px 0',
        }}>
          Explorar foros →
        </Link>
      </div>

      {/* Suggested devs */}
      {suggested.length > 0 && (
        <div className="card" style={{ padding: '14px 14px 6px' }}>
          <p style={{
            margin: '0 0 10px', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
          }}>
            Devs para conectar
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          </div>
          <Link href="/explore" style={{
            display: 'block', padding: '10px 4px 6px', fontSize: 12, color: 'var(--accent)',
            fontWeight: 700, textDecoration: 'none', textAlign: 'center',
          }}>
            Ver más devs →
          </Link>
        </div>
      )}

      {/* Footer */}
      <p style={{
        margin: 0, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6,
      }}>
        coldev 🇨🇴<br />Conecta. Comparte. Crece.
      </p>
    </aside>
  )
}
