'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconSearch, IconForum, IconMessage, IconUser } from './Icons'

const NAV = [
  { href: '/feed',     label: 'Feed',   Icon: IconHome    },
  { href: '/explore',  label: 'Buscar', Icon: IconSearch  },
  { href: '/foros',    label: 'Foros',  Icon: IconForum   },
  { href: '/mensajes', label: 'Inbox',  Icon: IconMessage },
  { href: '/perfil/me',label: 'Perfil', Icon: IconUser    },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      {NAV.map(({ href, label, Icon }) => {
        const isPerfil = href === '/perfil/me'
        const active = isPerfil
          ? pathname === '/perfil/me' || pathname.startsWith('/perfil/')
          : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} className={active ? 'active' : ''}>
            <span className="nav-icon"><Icon size={22} /></span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
