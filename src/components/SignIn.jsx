import { useState } from 'react'
import { PiggyBank, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SignIn({ onSignUp, onBack, onForgot }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="page auth-page">
      <div className="auth-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
        </button>
        <div className="wordmark" style={{ margin: 0 }}>
          <PiggyBank size={17} />
          Save
        </div>
      </div>

      <h2 className="auth-title">Welcome back</h2>

      <div className="card">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button type="button" className="link-btn" style={{ fontSize: '0.75rem', color: 'var(--muted)' }} onClick={onForgot}>
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? '...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button className="link-btn" onClick={onSignUp}>Sign up</button>
      </p>
    </div>
  )
}
