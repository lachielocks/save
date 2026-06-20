import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { weeklyRequired, totalSaved, progressPercent } from '../lib/calculations'

function fmt(n) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 })
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GoalCard({ goal, onDeposit, onDeleted }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deposits = goal.deposits || []
  const saved = totalSaved(deposits)
  const progress = progressPercent(goal.goal_amount, deposits)
  const weeklyNeeded = weeklyRequired({
    goalAmount: goal.goal_amount,
    endDate: goal.end_date,
    deposits,
  })
  const isComplete = saved >= goal.goal_amount

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
    onDeposit()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('goals').delete().eq('id', goal.id)
    onDeleted()
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stat-label">{goal.name}</div>
          {!confirmDelete ? (
            <button
              className="icon-btn"
              onClick={() => setConfirmDelete(true)}
              title="Delete goal"
            >
              <Trash2 size={13} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Delete?</span>
              <button className="icon-btn icon-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '...' : 'Yes'}
              </button>
              <button className="icon-btn" onClick={() => setConfirmDelete(false)}>No</button>
            </div>
          )}
        </div>

        <div className="stat-value" style={{ marginTop: 6 }}>
          {fmt(saved)}
          <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 400 }}>
            {' '}/ {fmt(goal.goal_amount)}
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
          <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg)', borderRadius: 8 }}>
            <div className="stat-label">Weekly target</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>
              {fmt(weeklyNeeded)}
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
                <div key={d.id} className="deposit-item">
                  <div>
                    <div className="deposit-amount">{fmt(d.amount)}</div>
                    {d.note && <div className="deposit-date">{d.note}</div>}
                  </div>
                  <div className="deposit-date">{fmtDate(d.created_at)}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  )
}
