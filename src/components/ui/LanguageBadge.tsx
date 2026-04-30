'use client'

import { cn } from '@/lib/utils'
import type { Language, Proficiency } from '@/types'

interface Props {
  language: Language
  proficiency?: Proficiency
  size?: 'sm' | 'md'
  selected?: boolean
  onClick?: () => void
}

const PROFICIENCY_LABEL: Record<Proficiency, string> = {
  aprendiendo: '📖',
  cómodo: '✨',
  experto: '⚡',
}

export default function LanguageBadge({ language, proficiency, size = 'md', selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'lang-badge transition-all',
        size === 'sm' && 'text-[11px] py-[2px] px-2',
        selected && 'ring-2 ring-current scale-105',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
      style={{ color: language.color }}
    >
      <span>{language.name}</span>
      {proficiency && <span className="opacity-70">{PROFICIENCY_LABEL[proficiency]}</span>}
    </button>
  )
}
