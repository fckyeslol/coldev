'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Post, Profile } from '@/types'
import { GOAL_LABELS, LEVEL_LABELS } from '@/types'
import Avatar from '@/components/ui/Avatar'
import PostCard from '@/components/feed/PostCard'
import EditProfileModal from '@/components/profile/EditProfileModal'

interface Props {
  profile: Profile & {
    followers_count: number
    following_count: number
    posts_count: number
    user_goals?: { goal: string }[]
    user_interests?: { topic: { id: number; name: string; icon: string } }[]
  }
  isOwnProfile: boolean
  initiallyFollowing: boolean
  isConnected?: boolean
}

const PROFICIENCY_LABEL: Record<string, string> = {
  aprendiendo: 'Aprendiendo',
  cómodo: 'Cómodo',
  experto: 'Experto',
}

export default function ProfileClient({
  profile, isOwnProfile, initiallyFollowing, isConnected = false,
}: Props) {
  const router = useRouter()
  const [following, setFollowing] = useState(initiallyFollowing)
  const [followersCount, setFollowersCount] = useState(profile.followers_count)
  const [followLoading, setFollowLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const canMessage = isConnected || following

  async function handleMessage() {
    if (messageLoading) return
    setMessageLoading(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
      })
      const data = await res.json()
      if (!res.ok) {
        setConnectError(data?.error ?? 'No se pudo abrir el chat')
        return
      }
      router.push(`/mensajes/${data.conversation_id}`)
    } catch {
      setConnectError('Error de conexión')
    } finally {
      setMessageLoading(false)
    }
  }

  useEffect(() => {
    fetch(`/api/posts?userId=${profile.id}`)
      .then((r) => r.json())
      .then(({ posts }) => { setPosts(posts ?? []); setPostsLoading(false) })
  }, [profile.id])

  async function handleFollow() {
    if (followLoading) return
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${profile.username}/follow`, { method: 'POST' })
      if (res.ok) {
        const { following: newFollowing } = await res.json()
        setFollowing(newFollowing)
        setFollowersCount((c) => newFollowing ? c + 1 : c - 1)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const langs = (profile.user_languages ?? []).filter((ul) => ul?.language)
  const goals = (profile.user_goals ?? []).map((g) => g.goal as keyof typeof GOAL_LABELS)
  const interests = (profile.user_interests ?? []).filter((ui) => ui?.topic)

  const showStack = langs.length > 0 || isOwnProfile
  const showGoals = goals.length > 0 || isOwnProfile
  const showInterests = interests.length > 0 || isOwnProfile

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Cover */}
      <div style={{
        height: 144,
        background: 'linear-gradient(135deg, #E87952 0%, #F4A847 60%, #FFFBF5 100%)',
      }} />

      <div style={{ padding: '0 28px 32px' }}>
        {/* ── Header row: avatar + actions */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 16, marginTop: -56, marginBottom: 20,
        }}>
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name}
            size="xl"
            style={{
              width: 112, height: 112,
              border: '4px solid var(--bg-primary)',
              flexShrink: 0,
              boxShadow: 'var(--shadow-md)',
            }}
          />
          <div style={{ paddingBottom: 6 }}>
            {isOwnProfile ? (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-secondary"
                style={{ fontSize: 13, padding: '10px 18px', borderRadius: 12, fontWeight: 700 }}
              >
                Editar perfil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {canMessage && (
                  <button
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, padding: '10px 18px', borderRadius: 12, fontWeight: 700 }}
                  >
                    {messageLoading ? '...' : 'Mensaje'}
                  </button>
                )}
                <button
                  onClick={handleFollow}
                  className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ fontSize: 13, padding: '10px 18px', borderRadius: 12, fontWeight: 700 }}
                >
                  {followLoading ? '...' : following ? 'Siguiendo' : 'Conectar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Identity */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)',
            }}>
              {profile.full_name}
            </h1>
            {profile.is_open_to_connect && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px',
                borderRadius: 999, background: 'var(--green-light)',
                color: 'var(--green)', border: '1px solid rgba(139, 168, 136, 0.35)',
                whiteSpace: 'nowrap',
              }}>
                Open to connect
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>@{profile.username}</p>
        </div>

        {connectError && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
          }}>{connectError}</div>
        )}

        {/* ── Meta chips (single source) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {profile.city && <Chip>{profile.city}</Chip>}
          <Chip emphasis>{LEVEL_LABELS[profile.level]}</Chip>
          {profile.github_url && <ChipLink href={profile.github_url}>GitHub</ChipLink>}
          {profile.linkedin_url && <ChipLink href={profile.linkedin_url}>LinkedIn</ChipLink>}
          {profile.website_url && <ChipLink href={profile.website_url}>Website</ChipLink>}
        </div>

        {/* ── Bio */}
        {profile.bio ? (
          <p style={{
            margin: '0 0 24px', fontSize: 15, lineHeight: 1.6, color: 'var(--text)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {profile.bio}
          </p>
        ) : isOwnProfile ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic',
              padding: '12px 16px', marginBottom: 24, borderRadius: 12,
              background: 'var(--bg-secondary)', border: '1.5px dashed var(--border-medium)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-dark)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Cuéntales a otros devs en qué estás trabajando o aprendiendo
          </button>
        ) : null}

        {/* ── Stats */}
        <div style={{
          display: 'flex', gap: 20, padding: '16px 20px', marginBottom: 24,
          background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          borderRadius: 16, boxShadow: 'var(--shadow-sm)',
        }}>
          <Stat label="Posts" value={profile.posts_count} />
          <Divider />
          <Stat label="Seguidores" value={followersCount} />
          <Divider />
          <Stat label="Siguiendo" value={profile.following_count} />
        </div>

        {/* ── Stack */}
        {showStack && (
          <InfoCard
            title="Stack"
            subtitle={langs.length > 0 ? `${langs.length} ${langs.length === 1 ? 'lenguaje' : 'lenguajes'}` : undefined}
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {langs.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {langs.map(({ language, proficiency }) => (
                  <span
                    key={language.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      fontSize: 13, padding: '6px 12px',
                      borderRadius: 999, fontWeight: 600,
                      color: language.color,
                      border: `1.5px solid ${language.color}50`,
                      background: `${language.color}12`,
                    }}
                  >
                    {language.name}
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', opacity: 0.7,
                    }}>
                      {PROFICIENCY_LABEL[proficiency] ?? proficiency}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <EmptyCTA
                onClick={() => setEditing(true)}
                title="Aún no tienes lenguajes en tu stack"
                action="Añadir lenguajes"
              />
            )}
          </InfoCard>
        )}

        {/* ── Goals */}
        {showGoals && (
          <InfoCard
            title="Buscando"
            subtitle={goals.length > 0 ? 'Lo que quieres en ColDev' : undefined}
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {goals.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {goals.map((goal) => (
                  <span
                    key={goal}
                    style={{
                      fontSize: 13, padding: '6px 14px',
                      borderRadius: 999, fontWeight: 600,
                      color: 'var(--accent-dark)',
                      border: '1.5px solid var(--accent)',
                      background: 'var(--accent-light)',
                    }}
                  >
                    {GOAL_LABELS[goal]}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyCTA
                onClick={() => setEditing(true)}
                title="Cuéntale al algoritmo qué buscas"
                action="Definir objetivos"
              />
            )}
          </InfoCard>
        )}

        {/* ── Interests */}
        {showInterests && (
          <InfoCard
            title="Intereses"
            subtitle={interests.length > 0 ? `${interests.length} ${interests.length === 1 ? 'tema' : 'temas'}` : undefined}
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {interests.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {interests.map(({ topic }) => (
                  <span
                    key={topic.id}
                    style={{
                      fontSize: 13, padding: '6px 14px',
                      borderRadius: 999, fontWeight: 500,
                      color: 'var(--text-secondary)',
                      border: '1.5px solid var(--border)',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    {topic.name}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyCTA
                onClick={() => setEditing(true)}
                title="Aún no tienes intereses"
                action="Elegir temas"
              />
            )}
          </InfoCard>
        )}
      </div>

      {editing && (
        <EditProfileModal profile={profile} onClose={() => setEditing(false)} />
      )}

      {/* ── Posts */}
      <div style={{ borderTop: '1.5px solid var(--border)' }}>
        <div style={{ padding: '16px 28px', borderBottom: '1.5px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Posts
          </h2>
        </div>
        {postsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '20px 28px', borderBottom: '1.5px solid var(--border)' }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 28px' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {isOwnProfile ? 'Aún no has publicado nada' : 'Aún no ha publicado nada'}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {isOwnProfile ? 'Comparte qué estás aprendiendo o construyendo.' : 'Vuelve más tarde.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={{ ...post, profile }} />
          ))
        )}
      </div>
    </div>
  )
}

/* ── Reusable bits */

function Chip({ children, emphasis }: { children: React.ReactNode; emphasis?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 12, fontWeight: emphasis ? 700 : 500,
      color: emphasis ? 'var(--text)' : 'var(--text-secondary)',
      background: 'var(--bg-secondary)',
      padding: '6px 12px', borderRadius: 8,
      border: '1px solid var(--border)',
    }}>
      {children}
    </span>
  )
}

function ChipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        padding: '6px 12px', borderRadius: 8,
        border: '1px solid var(--border)',
        textDecoration: 'none', transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {children}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
      </svg>
    </a>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{
        margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)',
        lineHeight: 1.1,
      }}>
        {value}
      </p>
      <p style={{
        margin: '4px 0 0', fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </p>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
}

function InfoCard({
  title, subtitle, children, onEdit,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <div style={{
      marginBottom: 16, padding: '18px 20px',
      background: 'var(--bg-card)', border: '1.5px solid var(--border)',
      borderRadius: 16, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontFamily: 'inherit',
            }}
          >
            Editar
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyCTA({
  title, action, onClick,
}: {
  title: string
  action: string
  onClick: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '12px 16px', borderRadius: 12,
      background: 'var(--bg-secondary)', border: '1.5px dashed var(--border-medium)',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        {title}
      </p>
      <button
        onClick={onClick}
        style={{
          fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          background: 'var(--accent-light)', border: '1.5px solid var(--accent)',
          padding: '6px 14px', borderRadius: 999,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)' }}
      >
        {action}
      </button>
    </div>
  )
}
