export type UserLevel = 'aprendiendo' | 'junior' | 'mid' | 'senior' | 'experto'
export type Proficiency = 'aprendiendo' | 'cómodo' | 'experto'
export type Goal = 'mentoring_dar' | 'mentoring_recibir' | 'colaborar' | 'networking' | 'aprender_juntos' | 'conseguir_trabajo' | 'contratar'
export type City = string

export interface Language {
  id: number
  name: string
  icon: string
  color: string
}

export interface Topic {
  id: number
  name: string
  icon: string
}

export interface UserLanguage {
  language: Language
  proficiency: Proficiency
}

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  city: City
  level: UserLevel
  github_url: string | null
  linkedin_url: string | null
  website_url: string | null
  is_open_to_connect: boolean
  activity_score: number
  created_at: string
  // Relations (joined)
  user_languages?: UserLanguage[]
  user_goals?: { goal: Goal }[]
  user_interests?: { topic: Topic }[]
  followers_count?: number
  following_count?: number
  posts_count?: number
}

export interface PollOption {
  id: string
  position: number
  text: string
  votes_count: number
}

export interface Poll {
  id: string
  question: string
  closes_at: string | null
  options: PollOption[]
  my_vote?: string | null
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  language_tags: number[]
  topic_tags: number[]
  likes_count: number
  reposts_count: number
  replies_count: number
  parent_id: string | null
  created_at: string
  // Relations
  profile?: Profile
  poll?: Poll | null
  has_liked?: boolean
  has_reposted?: boolean
  languages?: Language[]
}

export interface MatchScore {
  user_a: string
  user_b: string
  score: number
  language_score: number
  goal_score: number
  interest_score: number
}

export interface MatchedProfile extends Profile {
  match_score: number
  match_breakdown: {
    language_score: number
    goal_score: number
    interest_score: number
    activity_score: number
  }
  match_reasons: string[]
}

export interface OnboardingData {
  username: string
  full_name: string
  city: City
  level: UserLevel
  bio: string
  languages: { language_id: number; proficiency: Proficiency }[]
  goals: Goal[]
  interests: number[]
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'follow' | 'repost' | 'reply' | 'match'
  post_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
  post?: Post
}

export const GOAL_LABELS: Record<Goal, string> = {
  mentoring_dar: 'Dar mentoría',
  mentoring_recibir: 'Recibir mentoría',
  colaborar: 'Colaborar en proyectos',
  networking: 'Hacer networking',
  aprender_juntos: 'Aprender juntos',
  conseguir_trabajo: 'Conseguir trabajo',
  contratar: 'Contratar devs',
}

export const GOAL_ICONS: Record<Goal, string> = {
  mentoring_dar: '🧑‍🏫',
  mentoring_recibir: '🎓',
  colaborar: '🤝',
  networking: '🌐',
  aprender_juntos: '📚',
  conseguir_trabajo: '💼',
  contratar: '🏢',
}

export const LEVEL_LABELS: Record<UserLevel, string> = {
  aprendiendo: 'Aprendiendo',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  experto: 'Experto',
}

export const COMPLEMENTARY_GOALS: Partial<Record<Goal, Goal[]>> = {
  mentoring_dar: ['mentoring_recibir'],
  mentoring_recibir: ['mentoring_dar'],
  colaborar: ['colaborar'],
  aprender_juntos: ['aprender_juntos'],
  conseguir_trabajo: ['contratar'],
  contratar: ['conseguir_trabajo'],
}
