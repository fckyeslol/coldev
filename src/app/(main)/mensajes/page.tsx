import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InboxClient from './InboxClient'

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <InboxClient />
}
