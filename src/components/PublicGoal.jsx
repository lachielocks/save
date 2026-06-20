import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { totalSaved, progressPercent, weeklyRequired, projectedDate, fmt } from '../lib/calculations'

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PublicGoal({ goalId }) {
  const [goal, setGoal] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('goals')
      .select('*, deposits(*)')
      .eq('id', goalId)
      .eq('is_public', true)
      .single()
      .then(({ data }) => {
        if (data) setGoal(data)
        else setNotFound(true)
      })
  }, [goalId])

  if (notFound) {
    return (
      <div className="page auth-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="wordmark" style={{ marginBottom: 32 }}>
          <PiggyBank size={17} /> Save
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>This goal isn't available.</p>
      </div>
    )
  }

  if (!goal) return null

  const deposits = goal.deposits || []
  const saved = totalSaved(deposits)
  const progress = progressPercent(goal.goal_amount, deposits)
  const currency = goal.currency || 'AUD'
  const weeklyNeeded = weeklyRequired({ goalAmount: goal.goal_amount, endDate: goal.end_date, deposits })
  const isComplete = saved >= goal.goal_amount
  const projection = projectedDate(goal.goal_amount, deposits)

  return (
    <div className="page">
      <div className="wordmark">
        <PiggyBank size={17} />
        Save
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="card">
          <div className="stat-label">{goal.name}</div>
          <div className="stat-value" style={{ marginTop: 6 }}>
            {fmt(saved, currency)}
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
            <div style={{ marginTop: 16, padding: '14px', background: 'var(--bg)', borderRadius: 8 }}>
              <div className="stat-label">Weekly target</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>
                {fmt(weeklyNeeded, currency)}
              </div>
            </div>
          )}

          {!isComplete && projection && (
            <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
              <div className="stat-label" style={{ marginBottom: 2 }}>At their current rate</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Projected completion by{' '}
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

        {deposits.length > 0 && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 8 }}>Deposits</p>
            <div className="deposit-list">
              {[...deposits]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(d => (
                  <div key={d.id} className="deposit-item">
                    <div>
                      <div className="deposit-amount">{fmt(d.amount, currency)}</div>
                      {d.note && <div className="deposit-date">{d.note}</div>}
                    </div>
                    <div className="deposit-date">{fmtDate(d.created_at)}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: 24 }}>
          Powered by Save
        </p>
      </motion.div>
    </div>
  )
}
