import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MIN_WEEKS = 1
const MAX_WEEKS = 104 // 2 years

function endDateFromWeeks(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d
}

function fmtEndDate(date) {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewGoalForm({ userId, onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [weeks, setWeeks] = useState(12)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const weeklyAmount = amount ? (parseFloat(amount) / weeks).toFixed(2) : null
  const endDate = endDateFromWeeks(weeks)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.from('goals').insert({
      user_id: userId,
      name,
      goal_amount: parseFloat(amount),
      end_date: endDate.toISOString().split('T')[0],
    }).select().single()

    setLoading(false)
    if (error) return setError(error.message)
    onCreated(data)
  }

  return (
    <div className="card">
      <p className="section-title" style={{ marginBottom: 16 }}>New goal</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Japan trip"
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label>Target amount</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="2000"
            required
          />
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label>Timeframe</label>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
              {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </span>
          </div>
          <input
            type="range"
            className="slider"
            min={MIN_WEEKS}
            max={MAX_WEEKS}
            step={1}
            value={weeks}
            onChange={e => setWeeks(parseInt(e.target.value, 10))}
          />
          <div className="slider-meta">
            <span>by {fmtEndDate(endDate)}</span>
            {weeklyAmount && (
              <span>
                {parseFloat(weeklyAmount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })} / week
              </span>
            )}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginTop: 20 }}>
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? '...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
