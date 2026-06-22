import { useRef, useState, useEffect } from 'react'
import { ImagePlus, Pencil, Check, X } from 'lucide-react'
import { parseNoteBody, uploadNoteImage, saveGoalNote } from '../lib/notes'

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NoteContent({ body }) {
  const blocks = parseNoteBody(body)
  if (blocks.length === 0) {
    return <p className="note-empty">No notes yet. Add thoughts, plans, or images about this goal.</p>
  }
  return (
    <div className="note-content">
      {blocks.map(block => {
        if (block.type === 'image') {
          return (
            <img
              key={block.key}
              src={block.url}
              alt={block.alt || 'Note image'}
              className="note-image"
              loading="lazy"
            />
          )
        }
        if (block.type === 'break') return <br key={block.key} />
        return <p key={block.key}>{block.content}</p>
      })}
    </div>
  )
}

export default function GoalNotes({ goalId, note, onSaved }) {
  const initialBody = note?.body ?? ''
  const [editing, setEditing] = useState(!initialBody)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const next = note?.body ?? ''
    setBody(next)
    if (!next) setEditing(true)
  }, [note?.body, note?.updated_at])

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      await saveGoalNote(goalId, body)
      setEditing(false)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setError('')
    try {
      const url = await uploadNoteImage(goalId, file)
      const markdown = `\n![image](${url})\n`
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const next = body.slice(0, start) + markdown + body.slice(end)
        setBody(next)
        requestAnimationFrame(() => {
          textarea.focus()
          const pos = start + markdown.length
          textarea.setSelectionRange(pos, pos)
        })
      } else {
        setBody(prev => prev + markdown)
      }
      if (!editing) setEditing(true)
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
  }

  function handleCancel() {
    setBody(note?.body ?? '')
    setEditing(false)
    setError('')
  }

  return (
    <div className="card">
      <div className="note-header">
        <p className="section-title" style={{ marginBottom: 0 }}>Notes</p>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {note?.updated_at && !editing && (
            <span className="note-updated">Updated {fmtDate(note.updated_at)}</span>
          )}
          {!editing ? (
            <button className="icon-btn" onClick={() => setEditing(true)} title="Edit notes">
              <Pencil size={13} />
            </button>
          ) : (
            <>
              <button
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Add image"
              >
                {uploading ? '…' : <ImagePlus size={13} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              {initialBody && (
                <button className="icon-btn" onClick={handleCancel} title="Cancel">
                  <X size={13} />
                </button>
              )}
              <button className="icon-btn icon-btn-active" onClick={handleSave} disabled={saving} title="Save">
                <Check size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write notes about this goal — why you're saving, plans, reminders..."
            rows={8}
            autoFocus={!initialBody}
          />
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <NoteContent body={body} />
        </div>
      )}

      {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  )
}
