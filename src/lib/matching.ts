import type { Profile, Goal, Proficiency, MatchedProfile, COMPLEMENTARY_GOALS } from '@/types'

// Weights for the matching algorithm (must sum to 1.0)
const WEIGHTS = {
  language: 0.40,
  goal: 0.30,
  interest: 0.20,
  activity: 0.10,
}

// Proficiency compatibility matrix
// Columns = current user proficiency, Rows = candidate proficiency
// Higher = more compatible
const PROFICIENCY_MATRIX: Record<Proficiency, Record<Proficiency, number>> = {
  aprendiendo: { aprendiendo: 0.6, cómodo: 0.9, experto: 1.0 },
  cómodo:      { aprendiendo: 0.7, cómodo: 0.8, experto: 0.9 },
  experto:     { aprendiendo: 0.5, cómodo: 0.7, experto: 0.7 },
}

// Goals that complement each other
const COMPLEMENTARY: Partial<Record<Goal, Goal[]>> = {
  mentoring_dar:      ['mentoring_recibir'],
  mentoring_recibir:  ['mentoring_dar'],
  colaborar:          ['colaborar'],
  aprender_juntos:    ['aprender_juntos'],
  conseguir_trabajo:  ['contratar'],
  contratar:          ['conseguir_trabajo'],
  networking:         ['networking', 'colaborar', 'conseguir_trabajo', 'contratar'],
}

interface UserSnapshot {
  id: string
  languages: { language_id: number; proficiency: Proficiency }[]
  goals: Goal[]
  interests: number[]
  activity_score: number
}

export function computeMatchScore(
  currentUser: UserSnapshot,
  candidate: UserSnapshot,
): {
  score: number
  language_score: number
  goal_score: number
  interest_score: number
  activity_score: number
  reasons: string[]
} {
  const languageScore = computeLanguageScore(currentUser, candidate)
  const goalScore = computeGoalScore(currentUser.goals, candidate.goals)
  const interestScore = computeInterestScore(currentUser.interests, candidate.interests)
  const activityScore = computeActivityScore(candidate.activity_score)

  const score =
    languageScore * WEIGHTS.language +
    goalScore * WEIGHTS.goal +
    interestScore * WEIGHTS.interest +
    activityScore * WEIGHTS.activity

  const reasons = buildReasons(currentUser, candidate, { languageScore, goalScore, interestScore })

  return {
    score: Math.round(score * 100) / 100,
    language_score: Math.round(languageScore * 100) / 100,
    goal_score: Math.round(goalScore * 100) / 100,
    interest_score: Math.round(interestScore * 100) / 100,
    activity_score: Math.round(activityScore * 100) / 100,
    reasons,
  }
}

function computeLanguageScore(
  currentUser: UserSnapshot,
  candidate: UserSnapshot,
): number {
  if (currentUser.languages.length === 0 || candidate.languages.length === 0) return 0

  const currentLangMap = new Map(
    currentUser.languages.map((l) => [l.language_id, l.proficiency])
  )
  const candidateLangMap = new Map(
    candidate.languages.map((l) => [l.language_id, l.proficiency])
  )

  const allLangIds = new Set([...currentLangMap.keys(), ...candidateLangMap.keys()])
  let totalScore = 0
  let sharedCount = 0

  for (const langId of allLangIds) {
    const currentProf = currentLangMap.get(langId)
    const candidateProf = candidateLangMap.get(langId)

    if (currentProf && candidateProf) {
      sharedCount++
      // Use matrix: current user's level vs candidate's level
      totalScore += PROFICIENCY_MATRIX[currentProf][candidateProf]
    }
  }

  if (sharedCount === 0) return 0

  const overlapRatio = sharedCount / Math.min(currentUser.languages.length, candidate.languages.length)
  const avgCompatibility = totalScore / sharedCount

  return overlapRatio * avgCompatibility
}

function computeGoalScore(userGoals: Goal[], candidateGoals: Goal[]): number {
  if (userGoals.length === 0 || candidateGoals.length === 0) return 0

  let matchScore = 0
  let maxPossible = 0

  for (const userGoal of userGoals) {
    maxPossible += 1
    const complementary = COMPLEMENTARY[userGoal] ?? []

    for (const candGoal of candidateGoals) {
      if (complementary.includes(candGoal)) {
        matchScore += 1
        break
      }
      // Partial credit for same goal
      if (candGoal === userGoal) {
        matchScore += 0.5
        break
      }
    }
  }

  return maxPossible > 0 ? matchScore / maxPossible : 0
}

function computeInterestScore(userInterests: number[], candidateInterests: number[]): number {
  if (userInterests.length === 0 || candidateInterests.length === 0) return 0

  const set = new Set(candidateInterests)
  const shared = userInterests.filter((i) => set.has(i)).length
  const union = new Set([...userInterests, ...candidateInterests]).size

  return shared / union // Jaccard similarity
}

function computeActivityScore(activityScore: number): number {
  // Normalize to 0-1 with soft cap at 500 points
  return Math.min(activityScore / 500, 1)
}

function buildReasons(
  currentUser: UserSnapshot,
  candidate: UserSnapshot,
  scores: { languageScore: number; goalScore: number; interestScore: number },
): string[] {
  const reasons: string[] = []

  const currentLangIds = new Set(currentUser.languages.map((l) => l.language_id))
  const sharedLangs = candidate.languages.filter((l) => currentLangIds.has(l.language_id))
  if (sharedLangs.length > 0) {
    reasons.push(`Comparten ${sharedLangs.length} lenguaje${sharedLangs.length > 1 ? 's' : ''} en común`)
  }

  if (scores.goalScore > 0.5) {
    reasons.push('Tienen objetivos complementarios')
  }

  const currentInterestSet = new Set(currentUser.interests)
  const sharedInterests = candidate.interests.filter((i) => currentInterestSet.has(i))
  if (sharedInterests.length > 0) {
    reasons.push(`${sharedInterests.length} ${sharedInterests.length > 1 ? 'intereses' : 'interés'} en común`)
  }

  // Check if mentor-mentee match
  const userWantsMentor = currentUser.goals.includes('mentoring_recibir')
  const candidateGivesMentor = candidate.goals.includes('mentoring_dar')
  if (userWantsMentor && candidateGivesMentor) {
    reasons.push('Puede ser tu mentor')
  }

  const userGivesMentor = currentUser.goals.includes('mentoring_dar')
  const candidateWantsMentor = candidate.goals.includes('mentoring_recibir')
  if (userGivesMentor && candidateWantsMentor) {
    reasons.push('Puedes mentorearlo')
  }

  return reasons
}

export function rankCandidates(
  currentUser: UserSnapshot,
  candidates: (UserSnapshot & { profile: Profile })[],
): MatchedProfile[] {
  return candidates
    .filter((c) => c.id !== currentUser.id)
    .map((candidate) => {
      const match = computeMatchScore(currentUser, candidate)
      return {
        ...candidate.profile,
        match_score: match.score,
        match_breakdown: {
          language_score: match.language_score,
          goal_score: match.goal_score,
          interest_score: match.interest_score,
          activity_score: match.activity_score,
        },
        match_reasons: match.reasons,
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}
