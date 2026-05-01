import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ForumThreadsClient, { type ForumDef, type ThreadRow } from './ForumThreadsClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ForumPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: forum } = await supabase
    .from('forums')
    .select('id, slug, name, description, icon, color')
    .eq('slug', slug)
    .maybeSingle()

  if (!forum) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ForumThreadsClient
      forum={forum as ForumDef}
      initialThreads={[] as ThreadRow[]}
      isAuthed={!!user}
    />
  )
}
