import { useState } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fn = mode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password })

    const { error } = await fn
    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setSent(true)
    }
  }

  return (
    <div className="page">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="wordmark">
          <PiggyBank size={18} />
          Save
        </div>

        <div className="card">
          {sent ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Check your email to confirm your account.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              <div style={{ marginTop: 20 }} className="row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
