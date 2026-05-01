import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ThreadDetailClient, { type Comment, type Thread } from './ThreadDetailClient'

interface Props {
  params: Promise<{ slug: string; threadId: string }>
}

export default async function ForumThreadDetailPage({ params }: Props) {
  const { slug, threadId } = await params
  const supabase = await createClient()

  const { data: thread } = await supabase
    .from('forum_threads')
    .select(`
      id, title, content, score, comments_count, created_at, forum_id,
      author:profiles!forum_threads_user_id_fkey(id, username, full_name, avatar_url, level),
      forum:forums!forum_threads_forum_id_fkey(id, slug, name, icon, color)
    `)
    .eq('id', threadId)
    .maybeSingle()

  if (!thread) notFound()

  // Sanity: thread belongs to this slug
  const forumObj = thread.forum as unknown as { slug?: string } | null
  if (!forumObj || forumObj.slug !== slug) notFound()

  const { data: comments } = await supabase
    .from('forum_comments')
    .select(`
      id, content, created_at,
      author:profiles!forum_comments_user_id_fkey(id, username, full_name, avatar_url, level)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  let myVote = 0
  let isOwner = false
  if (user) {
    const { data: vote } = await supabase
      .from('forum_thread_votes')
      .select('value')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .maybeSingle()
    myVote = vote?.value ?? 0

    const authorObj = thread.author as unknown as { id?: string } | null
    isOwner = authorObj?.id === user.id
  }

  return (
    <ThreadDetailClient
      thread={{ ...thread, my_vote: myVote } as unknown as Thread}
      initialComments={(comments ?? []) as unknown as Comment[]}
      isAuthed={!!user}
      isOwner={isOwner}
    />
  )
}
