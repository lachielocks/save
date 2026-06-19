import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewGoalForm({ userId, onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.from('goals').insert({
      user_id: userId,
      name,
      goal_amount: parseFloat(amount),
      end_date: endDate,
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
          <label>Target date</label>
          <input
            type="date"
            value={endDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setEndDate(e.target.value)}
            required
          />
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
