import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'coldev — Conecta. Comparte. Crece.',
  description: 'La red social para developers en Colombia. Comparte tu stack, aprende, conecta.',
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  )
}
