import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PiggyBank, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageTransition } from '../App'
import Footer from './Footer'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <PageTransition>
      <div className="page auth-page">
        <div className="auth-header">
          <button className="back-btn" onClick={() => navigate('/login')}>
            <ArrowLeft size={15} />
          </button>
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={17} />
            Save
          </div>
        </div>

        <h2 className="auth-title">Reset your password</h2>

        <div className="card">
          {sent ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.65 }}>
              Check your email — we've sent a link to reset your password. You can close this tab.
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
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn" style={{ marginTop: 20 }} disabled={loading}>
                {loading ? '...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="auth-switch">
            Remembered it?{' '}
            <button className="link-btn" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        )}

        <Footer />
      </div>
    </PageTransition>
  )
}
