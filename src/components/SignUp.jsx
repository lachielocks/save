import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PiggyBank, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageTransition } from '../App'
import Footer from './Footer'

export default function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name.trim() } },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
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

        <h2 className="auth-title">Create an account</h2>

        <div className="card">
          {sent ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Check your email to confirm your account, then come back and sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name or nickname"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn" style={{ marginTop: 20 }} disabled={loading}>
                {loading ? '...' : 'Create account'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="auth-switch">
            Already have an account?{' '}
            <button className="link-btn" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        )}

        <Footer />
      </div>
    </PageTransition>
  )
}
