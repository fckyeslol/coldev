'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconSearch, IconGlobe, IconBell } from './Icons'

const NAV = [
  { href: '/feed',           label: 'Feed',     Icon: IconHome   },
  { href: '/explore',        label: 'Buscar',   Icon: IconSearch },
  { href: '/conectar',       label: 'Conectar', Icon: IconGlobe  },
  { href: '/notificaciones', label: 'Alertas',  Icon: IconBell   },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} className={active ? 'active' : ''}>
            <Icon size={22} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
