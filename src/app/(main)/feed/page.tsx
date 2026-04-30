import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedClient from './FeedClient'
import type { Profile } from '@/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user_languages(proficiency, language:languages(id, name, color))
    `)
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  return <FeedClient profile={profile as Profile} />
}
