import Link from 'next/link'

type Variant = 'full' | 'icon'

interface Props {
  variant?: Variant
  size?: number
  href?: string | null
  className?: string
}

// Brand logo: orange-to-gold gradient circle with a bean / code-bracket glyph
// inside, plus the "col<accent>dev</accent> · COLOMBIA" wordmark.
export default function ColDevLogo({
  variant = 'full',
  size = 40,
  href = '/feed',
  className,
}: Props) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="coldev"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="coldev-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E87952" />
          <stop offset="100%" stopColor="#F4A847" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#coldev-grad)" />
      {/* Bean / "c" curve */}
      <path
        d="M27 12.5c-2.6-2.4-6.7-2.6-9.4-.1-3.4 3.1-3.4 8.1 0 11.2 2.6 2.4 6.6 2.5 9.3.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Code brackets accent */}
      <path
        d="M14.6 26.4l-2-2 2-2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.4 26.4l2-2-2-2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const content =
    variant === 'icon' ? (
      mark
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} className={className}>
        {mark}
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', color: 'var(--text)' }}>
            col<span style={{ color: 'var(--accent)' }}>dev</span>
          </span>
          <span style={{
            marginTop: 2, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em',
            color: 'var(--text-muted)', textTransform: 'uppercase',
          }}>
            Colombia
          </span>
        </span>
      </span>
    )

  if (!href) return <span className={className}>{content}</span>
  return (
    <Link href={href} style={{ textDecoration: 'none' }} className={className}>
      {content}
    </Link>
  )
}
