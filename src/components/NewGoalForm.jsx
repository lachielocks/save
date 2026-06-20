import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../context/CurrencyContext'
import { fmt } from '../lib/calculations'

const MIN_WEEKS = 1
const MAX_WEEKS = 104

function endDateFromWeeks(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d
}

function fmtEndDate(date) {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewGoalForm({ userId, onCreated, onCancel }) {
  const { currency } = useCurrency()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [alreadySaved, setAlreadySaved] = useState('')
  const [weeks, setWeeks] = useState(12)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const target = parseFloat(amount) || 0
  const saved = parseFloat(alreadySaved) || 0
  const remaining = Math.max(0, target - saved)
  const weeklyAmount = target ? remaining / weeks : null
  const endDate = endDateFromWeeks(weeks)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (saved >= target && target > 0) {
      return setError("Already saved amount can't exceed the target.")
    }

    setLoading(true)

    const { data: goal, error: goalErr } = await supabase.from('goals').insert({
      user_id: userId,
      name,
      goal_amount: target,
      end_date: endDate.toISOString().split('T')[0],
    }).select().single()

    if (goalErr) { setLoading(false); return setError(goalErr.message) }

    // Insert the initial deposit if provided
    if (saved > 0) {
      const { error: depErr } = await supabase.from('deposits').insert({
        goal_id: goal.id,
        amount: saved,
        note: 'Already saved',
      })
      if (depErr) { setLoading(false); return setError(depErr.message) }
    }

    setLoading(false)
    onCreated(goal)
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
          <label>Already saved</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={alreadySaved}
            onChange={e => setAlreadySaved(e.target.value)}
            placeholder="0"
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
            {weeklyAmount !== null && (
              <span>{fmt(weeklyAmount, currency)} / week</span>
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
