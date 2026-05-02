import type { CSSProperties } from 'react'

// Detects http(s)://... and bare www. links. Hashtags and @mentions ignored for now.
const URL_RE = /(https?:\/\/[^\s<]+|\bwww\.[^\s<]+)/gi

const linkStyle: CSSProperties = {
  color: 'var(--accent-dark)',
  textDecoration: 'underline',
  wordBreak: 'break-word',
}

function ensureProtocol(href: string): string {
  return /^https?:\/\//i.test(href) ? href : `https://${href}`
}

// Splits text on URLs and renders <a target=_blank> for each. Preserves whitespace.
export default function Linkified({ text, style }: { text: string; style?: CSSProperties }) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  URL_RE.lastIndex = 0
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    let raw = match[0]
    // Trim trailing punctuation that's almost never part of a URL.
    let trailing = ''
    while (raw.length > 0 && /[.,);:!?]$/.test(raw)) {
      trailing = raw.slice(-1) + trailing
      raw = raw.slice(0, -1)
    }
    parts.push(
      <a
        key={`${match.index}-${raw}`}
        href={ensureProtocol(raw)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={linkStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {raw}
      </a>,
    )
    if (trailing) parts.push(trailing)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))

  return <span style={style}>{parts}</span>
}
