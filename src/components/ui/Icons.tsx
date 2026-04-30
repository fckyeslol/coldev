interface IconProps {
  size?: number
  stroke?: string
  className?: string
  style?: React.CSSProperties
}

const base = (size: number) => ({
  width: size,
  height: size,
  display: 'inline-block',
  flexShrink: 0,
} as const)

const props = (color = 'currentColor') => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconHome({ size = 20, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function IconSearch({ size = 20, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconGlobe({ size = 20, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

export function IconBell({ size = 20, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

export function IconHeart({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

export function IconMessage({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

export function IconRepeat({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

export function IconShare({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export function IconImage({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export function IconBarChart({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function IconLink({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

export function IconUser({ size = 20, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconEdit({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconMapPin({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconSend({ size = 18, stroke, style, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{ ...base(size), ...style }} className={className} {...props(stroke)}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
