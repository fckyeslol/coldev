const WARM_GRADIENTS = [
  'linear-gradient(135deg, #C65D3B, #E87952)',
  'linear-gradient(135deg, #E09B3D, #F4A847)',
  'linear-gradient(135deg, #7A9B77, #8BA888)',
  'linear-gradient(135deg, #D96B47, #F4A847)',
  'linear-gradient(135deg, #8BA888, #A4C5A1)',
  'linear-gradient(135deg, #C65D3B, #F4A847)',
]

const SIZES = {
  sm: { width: 32, height: 32, fontSize: 12 },
  md: { width: 40, height: 40, fontSize: 14 },
  lg: { width: 56, height: 56, fontSize: 20 },
  xl: { width: 80, height: 80, fontSize: 28 },
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

interface Props {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export default function Avatar({ src, name, size = 'md', className, style }: Props) {
  const { width, height, fontSize } = SIZES[size]
  const gradient = WARM_GRADIENTS[name.charCodeAt(0) % WARM_GRADIENTS.length]

  if (src) {
    return (
      <img src={src} alt={name} className={className}
        style={{ width, height, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }} />
    )
  }

  return (
    <div className={className} style={{
      width, height, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: gradient, color: 'white', fontWeight: 800, fontSize,
      letterSpacing: '-0.02em', ...style,
    }}>
      {getInitials(name)}
    </div>
  )
}
