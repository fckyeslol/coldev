import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the current user is a participant + load the other participant.
  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('user_id, user:profiles(id, username, full_name, avatar_url)')
    .eq('conversation_id', id)

  if (!parts || parts.length === 0) notFound()
  const me = parts.find((p) => p.user_id === user.id)
  if (!me) notFound()

  const otherRow = parts.find((p) => p.user_id !== user.id)
  const other = (otherRow?.user as unknown as {
    id: string; username: string; full_name: string; avatar_url: string | null
  } | null) ?? null

  return <ChatClient conversationId={id} other={other} currentUserId={user.id} />
}
