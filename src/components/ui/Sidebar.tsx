'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'
import Avatar from './Avatar'
import { IconHome, IconSearch, IconGlobe, IconBell, IconEdit, IconMessage, IconForum } from './Icons'

const NAV = [
  { href: '/feed',           label: 'Feed',           Icon: IconHome    },
  { href: '/explore',        label: 'Explorar',       Icon: IconSearch  },
  { href: '/foros',          label: 'Foros',          Icon: IconForum, badge: 'NUEVO' },
  { href: '/conectar',       label: 'Conectar',       Icon: IconGlobe   },
  { href: '/mensajes',       label: 'Mensajes',       Icon: IconMessage },
  { href: '/notificaciones', label: 'Notificaciones', Icon: IconBell    },
] as const

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const { unread: count } = await res.json()
        if (!cancelled) setUnread(count ?? 0)
      } catch {}
    }
    load()
    const onFocus = () => load()
    const interval = setInterval(load, 30_000)
    window.addEventListener('focus', onFocus)
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener('focus', onFocus) }
  }, [profile])

  // Hide the badge as soon as user lands on the notifications page.
  useEffect(() => {
    if (pathname === '/notificaciones' && unread > 0) {
      const t = setTimeout(() => setUnread(0), 1500)
      return () => clearTimeout(t)
    }
  }, [pathname, unread])

  return (
    <aside className="sidebar-fixed" style={{
      position: 'fixed', left: 0, top: 0, height: '100%', width: 256,
      display: 'flex', flexDirection: 'column', padding: '12px 12px 16px',
      borderRight: '1.5px solid var(--border)',
      background: 'var(--bg-secondary)',
      zIndex: 20,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <Link href="/feed" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 12px 16px', textDecoration: 'none', marginBottom: 4,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="coldev logo"
          width={36}
          height={36}
          style={{ borderRadius: 10, flexShrink: 0, objectFit: 'contain' }}
        />
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          col<span style={{ color: 'var(--accent)' }}>dev</span>
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => {
          const { href, label, Icon } = item
          const badge = 'badge' in item ? item.badge : undefined
          const active = pathname === href || pathname.startsWith(href + '/')
          const showUnread = href === '/notificaciones' && unread > 0
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12, textDecoration: 'none',
              fontWeight: active ? 700 : 500, fontSize: 15,
              color: active ? 'var(--accent-dark)' : 'var(--text-muted)',
              background: active ? 'var(--accent-light)' : 'transparent',
              borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              }
            }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={20} />
                {showUnread && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: 'var(--accent)', color: 'white',
                    fontSize: 10, fontWeight: 800,
                    minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 999, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-secondary)',
                    lineHeight: 1,
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                  background: 'var(--yellow)', color: '#2D2621', letterSpacing: '0.02em',
                  flexShrink: 0,
                }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Publish button */}
      <Link href="/feed" className="btn btn-primary" style={{
        width: '100%', marginBottom: 12, fontSize: 15, borderRadius: 14,
        textDecoration: 'none', justifyContent: 'center',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <IconEdit size={16} stroke="white" />
        Publicar
      </Link>

      {/* Profile */}
      {profile && (
        <Link href={`/perfil/${profile.username}`} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 12, textDecoration: 'none',
          border: '1.5px solid var(--border)', background: 'var(--bg-card)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
        >
          <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: 'var(--text)',
            }}>
              {profile.full_name}
            </p>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--text-muted)' }}>
              @{profile.username}
            </p>
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: 16, flexShrink: 0 }}>···</span>
        </Link>
      )}
    </aside>
  )
}
