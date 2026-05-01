import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('forums')
    .select('id, slug, name, description, icon, color')
    .order('id', { ascending: true })

  if (error) {
    console.error('forums list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ forums: data ?? [] })
}
