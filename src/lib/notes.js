import { supabase } from './supabase'

export function parseNoteBody(body) {
  if (!body?.trim()) return []
  return body.split('\n').map((line, i) => {
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) return { type: 'image', alt: imgMatch[1], url: imgMatch[2], key: i }
    if (line.trim()) return { type: 'text', content: line, key: i }
    return { type: 'break', key: i }
  })
}

export async function uploadNoteImage(goalId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${goalId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('goal-note-images')
    .upload(path, file, { contentType: file.type })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('goal-note-images')
    .getPublicUrl(path)

  return publicUrl
}

export async function saveGoalNote(goalId, body) {
  const { data, error } = await supabase
    .from('goal_notes')
    .upsert(
      { goal_id: goalId, body, updated_at: new Date().toISOString() },
      { onConflict: 'goal_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
