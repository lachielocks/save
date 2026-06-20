import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PiggyBank, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageTransition } from '../App'
import Footer from './Footer'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicMode, setMagicMode] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) setError(error.message)
    else setMagicSent(true)
  }

  return (
    <PageTransition>
      <div className="page auth-page">
        <div className="auth-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={15} />
          </button>
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={17} />
            Save
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>

        <div className="card">
          {magicMode ? (
            magicSent ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                Check your email — we sent a sign-in link. You can close this tab.
              </p>
            ) : (
              <form onSubmit={handleMagicLink}>
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
                  {loading ? '...' : 'Send magic link'}
                </button>
              </form>
            )
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Password</label>
                  <button type="button" className="link-btn" style={{ fontSize: '0.75rem', color: 'var(--muted)' }} onClick={() => navigate('/forgot')}>
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
          )}
        </div>

        {!magicSent && (
          <p className="auth-switch">
            {magicMode ? (
              <>Use a password instead?{' '}
                <button className="link-btn" onClick={() => { setMagicMode(false); setError('') }}>Sign in with password</button>
              </>
            ) : (
              <>Prefer a magic link?{' '}
                <button className="link-btn" onClick={() => { setMagicMode(true); setError('') }}>Email me a link</button>
              </>
            )}
          </p>
        )}

        <p className="auth-switch">
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/signup')}>Sign up</button>
        </p>

        <Footer />
      </div>
    </PageTransition>
  )
}
