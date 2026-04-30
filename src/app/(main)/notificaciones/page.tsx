import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationsClient, { type NotificationRow } from './NotificationsClient'

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, type, post_id, read, created_at,
      actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url),
      post:posts!notifications_post_id_fkey(id, content)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('Notifications fetch error:', error)

  return <NotificationsClient initial={(data ?? []) as unknown as NotificationRow[]} />
}
