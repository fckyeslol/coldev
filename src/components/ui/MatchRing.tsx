'use client'

interface Props {
  score: number
  size?: number
  showLabel?: boolean
}

export default function MatchRing({ score, size = 48, showLabel = true }: Props) {
  const percent = Math.round(score * 100)
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  const color = percent >= 70 ? '#8BA888' : percent >= 40 ? '#E87952' : '#C5BFB8'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      {showLabel && (
        <span style={{ position: 'absolute', fontSize: 10, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
          {percent}%
        </span>
      )}
    </div>
  )
}
