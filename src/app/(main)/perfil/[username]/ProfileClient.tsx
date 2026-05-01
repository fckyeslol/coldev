'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Post, Profile } from '@/types'
import { GOAL_ICONS, GOAL_LABELS, LEVEL_LABELS } from '@/types'
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

export default function ProfileClient({ profile, isOwnProfile, initiallyFollowing, isConnected = false }: Props) {
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

  const showStack     = langs.length > 0 || isOwnProfile
  const showGoals     = goals.length > 0 || isOwnProfile
  const showInterests = interests.length > 0 || isOwnProfile

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-[var(--accent)] via-purple-800 to-[var(--bg-card)]" />

      <div className="px-6 pb-8">
        {/* Avatar + action */}
        <div className="flex items-end justify-between gap-4 -mt-14 mb-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name}
            size="xl"
            className="border-4 border-[var(--bg)] flex-shrink-0"
          />
          {isOwnProfile ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-secondary text-sm py-2 flex-shrink-0"
            >
              Editar perfil
            </button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              {canMessage && (
                <button
                  onClick={handleMessage}
                  disabled={messageLoading}
                  className="btn btn-secondary text-sm py-2"
                  aria-label="Enviar mensaje"
                >
                  💬 {messageLoading ? '...' : 'Mensaje'}
                </button>
              )}
              <button
                onClick={handleFollow}
                className={`btn text-sm py-2 ${following ? 'btn-secondary' : 'btn-primary'}`}
              >
                {followLoading ? '...' : following ? '✓ Siguiendo' : '+ Conectar'}
              </button>
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Name + username */}
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="text-[22px] font-black tracking-tight">{profile.full_name}</h1>
            {profile.is_open_to_connect && (
              <span className="text-[10px] text-[var(--green)] font-semibold bg-[#EEF4ED] px-2.5 py-1 rounded-full border border-[var(--green)]/30 whitespace-nowrap">
                ● Open to connect
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)] text-[14px]">@{profile.username}</p>
=======
        {connectError && (
          <div style={{
            marginBottom: 12, padding: '8px 12px', borderRadius: 10, fontSize: 13,
            background: '#FEF2F0', border: '1.5px solid #FCCFBF', color: '#C65D3B',
          }}>{connectError}</div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 text-xs text-[var(--text-muted)] flex-wrap">
          <span>📍 {profile.city}</span>
          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] font-medium">
            {LEVEL_LABELS[profile.level]}
          </span>
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noopener"
              className="hover:text-[var(--text)] flex items-center gap-1">
              🐙 GitHub
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener"
              className="hover:text-[var(--text)] flex items-center gap-1">
              💼 LinkedIn
            </a>
          )}
          {profile.website_url && (
            <a href={profile.website_url} target="_blank" rel="noopener"
              className="hover:text-[var(--text)] flex items-center gap-1">
              🔗 Web
            </a>
          )}
>>>>>>> 82dd61a (major changes)
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p className="text-[14px] text-[var(--text)] leading-relaxed mb-4">{profile.bio}</p>
        ) : isOwnProfile ? (
          <button
            onClick={() => setEditing(true)}
            className="text-[13px] text-[var(--text-muted)] mb-4 italic hover:text-[var(--accent)] text-left transition-colors"
          >
            ✍️ Añade una bio para que otros devs te conozcan…
          </button>
        ) : null}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {profile.city && (
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)]">
              📍 {profile.city}
            </span>
          )}
          <span className="inline-flex items-center text-[12px] font-semibold text-[var(--text)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)]">
            {LEVEL_LABELS[profile.level]}
          </span>
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              🐙 GitHub
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              💼 LinkedIn
            </a>
          )}
          {profile.website_url && (
            <a href={profile.website_url} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              🔗 Web
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-1 mb-6">
          <div className="flex-1 text-center py-3 rounded-l-2xl border border-[var(--border)] border-r-0 bg-[var(--bg-secondary)]">
            <p className="text-[18px] font-black">{profile.posts_count}</p>
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Posts</p>
          </div>
          <div className="flex-1 text-center py-3 border border-[var(--border)] bg-[var(--bg-secondary)]">
            <p className="text-[18px] font-black">{followersCount}</p>
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Seguidores</p>
          </div>
          <div className="flex-1 text-center py-3 rounded-r-2xl border border-[var(--border)] border-l-0 bg-[var(--bg-secondary)]">
            <p className="text-[18px] font-black">{profile.following_count}</p>
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Siguiendo</p>
          </div>
        </div>

        {/* Stack */}
        {showStack && (
          <InfoSection
            title="Stack"
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {langs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {langs.map(({ language, proficiency }) => (
                  <span
                    key={language.id}
                    className="text-[12px] px-3 py-1 rounded-full font-semibold border"
                    style={{
                      color: language.color,
                      borderColor: `${language.color}40`,
                      background: `${language.color}12`,
                    }}
                  >
                    {language.name}
                    <span className="ml-1 opacity-60">
                      {proficiency === 'aprendiendo' ? '📖' : proficiency === 'cómodo' ? '✨' : '⚡'}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint onClick={() => setEditing(true)} text="Añadir lenguajes a tu stack" />
            )}
          </InfoSection>
        )}

        {/* Goals */}
        {showGoals && (
          <InfoSection
            title="Buscando"
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => (
                  <span
                    key={goal}
                    className="text-[12px] px-3 py-1 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-glow)] text-[var(--accent)] font-medium"
                  >
                    {GOAL_ICONS[goal]} {GOAL_LABELS[goal]}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint onClick={() => setEditing(true)} text="Cuéntale al algoritmo qué buscas" />
            )}
          </InfoSection>
        )}

        {/* Interests */}
        {showInterests && (
          <InfoSection
            title="Intereses"
            onEdit={isOwnProfile ? () => setEditing(true) : undefined}
          >
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map(({ topic }) => (
                  <span
                    key={topic.id}
                    className="text-[12px] px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  >
                    {topic.icon} {topic.name}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint onClick={() => setEditing(true)} text="Añadir temas de interés" />
            )}
          </InfoSection>
        )}
      </div>

      {editing && (
        <EditProfileModal profile={profile} onClose={() => setEditing(false)} />
      )}

      {/* Posts */}
      <div className="border-t border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[14px]">Posts</h2>
        </div>
        {postsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 px-6 py-4 border-b border-[var(--border)]">
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-4xl mb-3">✏️</p>
            <p className="text-[13px] font-medium">Aún no hay posts</p>
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

function InfoSection({
  title,
  children,
  onEdit,
}: {
  title: string
  children: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <div className="mb-5 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em]">
          {title}
        </p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-[11px] text-[var(--accent)] font-semibold hover:underline"
          >
            Editar
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyHint({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[12px] px-3 py-1.5 rounded-full border border-dashed border-[var(--border-hover)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      + {text}
    </button>
  )
}
