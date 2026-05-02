'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconSearch, IconMessage, IconConnect, IconUser } from './Icons'

const NAV = [
  { href: '/feed',      label: 'Feed',     Icon: IconHome    },
  { href: '/explore',   label: 'Buscar',   Icon: IconSearch  },
  { href: '/perfil/me', label: 'Perfil',   Icon: IconUser,   center: true },
  { href: '/conectar',  label: 'Conectar', Icon: IconConnect },
  { href: '/mensajes',  label: 'Inbox',    Icon: IconMessage },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      {NAV.map(({ href, label, Icon, center }) => {
        const isPerfil = href === '/perfil/me'
        const active = isPerfil
          ? pathname === '/perfil/me' || pathname.startsWith('/perfil/')
          : pathname === href || pathname.startsWith(href + '/')

        if (center) {
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: active ? 'var(--accent)' : 'var(--bg-secondary)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  <Icon
                    size={20}
                    stroke={active ? 'white' : 'var(--text-muted)'}
                  />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        }

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
