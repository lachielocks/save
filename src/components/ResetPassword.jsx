import { useState } from 'react'
import { PiggyBank, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError("Passwords don't match.")
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) setError(error.message)
    else setDone(true)
  }

  return (
    <div className="page auth-page">
      <div className="auth-header">
        <div className="wordmark" style={{ margin: 0 }}>
          <PiggyBank size={17} />
          Save
        </div>
      </div>

      <h2 className="auth-title">Choose a new password</h2>

      <div className="card">
        {done ? (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 20 }}>
              Password updated. Sign in with your new password.
            </p>
            <button className="btn" onClick={onDone}>
              Go to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>New password</label>
              <div className="input-wrap">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  autoFocus
                />
                <button type="button" className="input-eye" onClick={() => setShow(s => !s)}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Same again"
                minLength={6}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" style={{ marginTop: 20 }} disabled={loading}>
              {loading ? '...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
