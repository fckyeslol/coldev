'use client'

import { useEffect, useState } from 'react'
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
}

export default function ProfileClient({ profile, isOwnProfile, initiallyFollowing }: Props) {
  const [following, setFollowing] = useState(initiallyFollowing)
  const [followersCount, setFollowersCount] = useState(profile.followers_count)
  const [followLoading, setFollowLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [editing, setEditing] = useState(false)

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
    <div className="min-h-screen">
      {/* Cover gradient */}
      <div className="h-32 bg-gradient-to-br from-[var(--accent)] via-purple-800 to-[var(--bg-card)]" />

      <div className="px-5 pt-3 pb-5">
        {/* Header row: avatar + identity on one line; action button on the right */}
        <div className="flex items-end justify-between gap-4 -mt-14 mb-3">
          <div className="flex items-end gap-4 min-w-0">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              className="border-4 border-[var(--bg)] flex-shrink-0"
            />
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black truncate">{profile.full_name}</h1>
                {profile.is_open_to_connect && (
                  <span className="text-[10px] text-[var(--green)] font-medium bg-[var(--green-glow)] px-2 py-0.5 rounded-full border border-[var(--green)]/30 whitespace-nowrap">
                    ● Open to connect
                  </span>
                )}
              </div>
              <p className="text-[var(--text-muted)] text-sm">@{profile.username}</p>
            </div>
          </div>
          {isOwnProfile ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-secondary text-sm py-2 flex-shrink-0"
            >
              Editar perfil
            </button>
          ) : (
            <button
              onClick={handleFollow}
              className={`btn text-sm py-2 flex-shrink-0 ${following ? 'btn-secondary' : 'btn-primary'}`}
            >
              {followLoading ? '...' : following ? '✓ Siguiendo' : '+ Conectar'}
            </button>
          )}
        </div>

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
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p className="text-sm text-[var(--text)] mb-4 leading-relaxed">{profile.bio}</p>
        ) : isOwnProfile ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[var(--text-muted)] mb-4 italic hover:text-[var(--accent)] text-left"
          >
            ✍️ Añade una bio para que otros devs te conozcan…
          </button>
        ) : null}

        {/* Stats */}
        <div className="flex gap-6 mb-5 text-sm">
          <div>
            <span className="font-bold">{profile.posts_count}</span>
            <span className="text-[var(--text-muted)] ml-1">Posts</span>
          </div>
          <div>
            <span className="font-bold">{followersCount}</span>
            <span className="text-[var(--text-muted)] ml-1">Seguidores</span>
          </div>
          <div>
            <span className="font-bold">{profile.following_count}</span>
            <span className="text-[var(--text-muted)] ml-1">Siguiendo</span>
          </div>
        </div>

        {/* Stack */}
        {showStack && (
          <Section title="Stack">
            {langs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {langs.map(({ language, proficiency }) => (
                  <span
                    key={language.id}
                    className="text-xs px-3 py-1 rounded-full font-semibold border"
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
              <EmptyHint onClick={() => setEditing(true)} text="Añadir lenguajes" />
            )}
          </Section>
        )}

        {/* Goals */}
        {showGoals && (
          <Section title="Buscando">
            {goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => (
                  <span key={goal} className="text-xs px-3 py-1 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-glow)] text-[var(--accent)] font-medium">
                    {GOAL_ICONS[goal]} {GOAL_LABELS[goal]}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint onClick={() => setEditing(true)} text="Cuéntale al algoritmo qué buscas" />
            )}
          </Section>
        )}

        {/* Interests */}
        {showInterests && (
          <Section title="Intereses">
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map(({ topic }) => (
                  <span key={topic.id} className="text-xs px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]">
                    {topic.icon} {topic.name}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint onClick={() => setEditing(true)} text="Añadir temas de interés" />
            )}
          </Section>
        )}
      </div>

      {editing && (
        <EditProfileModal profile={profile} onClose={() => setEditing(false)} />
      )}

      {/* Posts */}
      <div className="border-t border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="font-bold text-sm">Posts</h2>
        </div>
        {postsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-4 border-b border-[var(--border)]">
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <p className="text-3xl mb-2">✏️</p>
            <p className="text-sm">Aún no hay posts</p>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

function EmptyHint({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full border border-dashed border-[var(--border-hover)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      + {text}
    </button>
  )
}
