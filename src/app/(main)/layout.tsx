import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'
import MobileNav from '@/components/ui/MobileNav'
import type { Profile } from '@/types'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="layout-root">
      <div className="layout-sidebar">
        <Sidebar profile={profile} />
      </div>
      <main className="layout-main">
        {children}
      </main>
      <div className="layout-aside" />
      <MobileNav />
    </div>
  )
}
