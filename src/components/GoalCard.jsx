import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Share2, Check, X, ImagePlus, Pencil, Archive } from 'lucide-react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../context/CurrencyContext'
import CountUp from './CountUp'
import {
  weeklyRequired, totalSaved, progressPercent,
  thisWeekDeposited, projectedDate, fmt,
} from '../lib/calculations'

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getCurrencySymbol(currency) {
  const parts = Intl.NumberFormat(undefined, { style: 'currency', currency }).formatToParts(0)
  return parts.find(p => p.type === 'currency')?.value ?? currency
}

function DepositRow({ deposit, currency, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('deposits').delete().eq('id', deposit.id)
    onDelete()
  }

  return (
    <div className="deposit-item">
      <div>
        <div className="deposit-amount">{fmt(deposit.amount, currency)}</div>
        {deposit.note && <div className="deposit-date">{deposit.note}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="deposit-date">{fmtDate(deposit.created_at)}</div>
        {!confirm ? (
          <button className="icon-btn" onClick={() => setConfirm(true)} title="Delete deposit">
            <X size={12} />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn icon-btn-danger" onClick={handleDelete} disabled={deleting}>
              <Check size={12} />
            </button>
            <button className="icon-btn" onClick={() => setConfirm(false)}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const MIN_WEEKS = 1
const MAX_WEEKS = 104

function weeksFromDate(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.max(MIN_WEEKS, Math.round(diff / (7 * 24 * 60 * 60 * 1000)))
}

function endDateFromWeeks(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

function fmtEndDateStr(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GoalCard({ goal, onDeposit, onDeleted, onImageChange }) {
  const { currency } = useCurrency()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [isPublic, setIsPublic] = useState(goal.is_public || false)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(goal.name)
  const [editAmount, setEditAmount] = useState(String(goal.goal_amount))
  const [editWeeks, setEditWeeks] = useState(() => weeksFromDate(goal.end_date))
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const wasComplete = useRef(false)

  const deposits = goal.deposits || []
  const saved = totalSaved(deposits)
  const isComplete = saved >= goal.goal_amount

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
    }
    wasComplete.current = isComplete
  }, [isComplete])

  async function handleArchive() {
    setArchiving(true)
    await supabase.from('goals').update({ archived_at: new Date().toISOString() }).eq('id', goal.id)
    onDeleted()
  }

  async function handleEdit(e) {
    e.preventDefault()
    setEditError('')
    setEditLoading(true)
    const { error } = await supabase.from('goals').update({
      name: editName.trim(),
      goal_amount: parseFloat(editAmount),
      end_date: endDateFromWeeks(editWeeks),
    }).eq('id', goal.id)
    setEditLoading(false)
    if (error) return setEditError(error.message)
    setEditing(false)
    onImageChange() // reuse to trigger fetchGoals
  }

  const prevSaved = useRef(saved)
  const symbol = getCurrencySymbol(currency)
  const progress = progressPercent(goal.goal_amount, deposits)
  const weeklyNeeded = weeklyRequired({ goalAmount: goal.goal_amount, endDate: goal.end_date, deposits })
  const weekSaved = thisWeekDeposited(deposits)
  const delta = weekSaved - weeklyNeeded
  const projection = projectedDate(goal.goal_amount, deposits)

  async function handleDeposit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.from('deposits').insert({
      goal_id: goal.id,
      amount: parseFloat(amount),
      note: note || null,
    })
    setLoading(false)
    if (error) return setError(error.message)
    setAmount('')
    setNote('')
    navigator.vibrate?.(40)
    onDeposit()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('goals').delete().eq('id', goal.id)
    onDeleted()
  }

  async function toggleShare() {
    const next = !isPublic
    setSharing(true)
    await supabase.from('goals').update({ is_public: next }).eq('id', goal.id)
    setIsPublic(next)
    setSharing(false)
    if (next) {
      const url = `${window.location.origin}${window.location.pathname}?goal=${goal.id}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')

    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${goal.id}.${ext}`

    // Remove any existing file first so we only need INSERT, not UPDATE
    await supabase.storage.from('goal-images').remove([path])

    const { error: uploadErr } = await supabase.storage
      .from('goal-images')
      .upload(path, file, { contentType: file.type })

    if (uploadErr) {
      setUploadError(uploadErr.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('goal-images')
      .getPublicUrl(path)

    const { error: updateErr } = await supabase
      .from('goals')
      .update({ image_url: publicUrl })
      .eq('id', goal.id)

    if (updateErr) {
      setUploadError(updateErr.message)
      setUploading(false)
      return
    }

    setUploading(false)
    onImageChange()
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stat-label">{goal.name}</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {/* Edit */}
            <button
              className={`icon-btn ${editing ? 'icon-btn-active' : ''}`}
              onClick={() => { setEditing(e => !e); setEditError('') }}
              title="Edit goal"
            >
              <Pencil size={13} />
            </button>

            {/* Archive (only when complete) */}
            {isComplete && (
              <button
                className="icon-btn"
                onClick={handleArchive}
                disabled={archiving}
                title="Archive goal"
              >
                <Archive size={13} />
              </button>
            )}

            {/* Image upload */}
            <button
              className={`icon-btn ${goal.image_url ? 'icon-btn-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={goal.image_url ? 'Change image' : 'Add image'}
            >
              {uploading ? '…' : <ImagePlus size={13} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            {/* Share */}
            <button
              className={`icon-btn ${isPublic ? 'icon-btn-active' : ''}`}
              onClick={toggleShare}
              disabled={sharing}
              title={isPublic ? 'Public — click to make private' : 'Share goal'}
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
            </button>

            {/* Delete */}
            {!confirmDelete ? (
              <button className="icon-btn" onClick={() => setConfirmDelete(true)} title="Delete goal">
                <Trash2 size={13} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Delete?</span>
                <button className="icon-btn icon-btn-danger" onClick={handleDelete} disabled={deleting}>
                  <Check size={12} />
                </button>
                <button className="icon-btn" onClick={() => setConfirmDelete(false)}>
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {copied && (
          <p style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            Link copied to clipboard
          </p>
        )}
        {uploadError && (
          <p className="error" style={{ marginTop: 4 }}>{uploadError}</p>
        )}

        {editing && (
          <form onSubmit={handleEdit} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div className="field">
              <label>Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Target amount</label>
              <input type="number" min="1" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} required />
            </div>
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label>Timeframe</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
                  {editWeeks} {editWeeks === 1 ? 'week' : 'weeks'}
                </span>
              </div>
              <input
                type="range"
                className="slider"
                min={MIN_WEEKS}
                max={MAX_WEEKS}
                step={1}
                value={editWeeks}
                onChange={e => setEditWeeks(parseInt(e.target.value, 10))}
              />
              <div className="slider-meta">
                <span>by {fmtEndDateStr(endDateFromWeeks(editWeeks))}</span>
                <span>{fmt(Math.max(0, parseFloat(editAmount) || 0) / editWeeks, currency)} / week</span>
              </div>
            </div>
            {editError && <p className="error">{editError}</p>}
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn" disabled={editLoading}>{editLoading ? '...' : 'Save'}</button>
            </div>
          </form>
        )}

        <div className="stat-value" style={{ marginTop: 6 }}>
          <span>{symbol}</span>
          <CountUp
            from={prevSaved.current}
            to={saved}
            separator=","
            duration={1}
            onEnd={() => { prevSaved.current = saved }}
          />
          <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 400 }}>
            {' '}/ {fmt(goal.goal_amount, currency)}
          </span>
        </div>

        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <div className="meta">
          <span>{progress.toFixed(0)}% saved</span>
          <span>by {fmtDate(goal.end_date)}</span>
        </div>

        {!isComplete && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 8 }}>
              <div className="stat-label">Weekly target</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>
                {fmt(weeklyNeeded, currency)}
              </div>
            </div>
            <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 8 }}>
              <div className="stat-label">This week</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>
                {fmt(weekSaved, currency)}
              </div>
              {weekSaved > 0 && (
                <div style={{ fontSize: '0.72rem', marginTop: 3, color: delta >= 0 ? 'var(--green)' : 'var(--muted)' }}>
                  {delta >= 0
                    ? `${fmt(delta, currency)} ahead`
                    : `${fmt(Math.abs(delta), currency)} behind`}
                </div>
              )}
            </div>
          </div>
        )}

        {!isComplete && projection && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
            <div className="stat-label" style={{ marginBottom: 2 }}>At your current rate</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              You'll reach this goal by{' '}
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                {projection.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        {isComplete && (
          <div style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--green)' }}>
            Goal reached
          </div>
        )}
      </div>

      {!isComplete && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>Add deposit</p>
          <form onSubmit={handleDeposit}>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Paycheck, birthday money..."
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? '...' : 'Deposit'}
            </button>
          </form>
        </div>
      )}

      {deposits.length > 0 && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 8 }}>History</p>
          <div className="deposit-list">
            {[...deposits]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map(d => (
                <DepositRow key={d.id} deposit={d} currency={currency} onDelete={onDeposit} />
              ))}
          </div>
        </div>
      )}
    </>
  )
}
