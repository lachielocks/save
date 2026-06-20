import { useState } from 'react'
import { ArrowLeft, PiggyBank, Eye, EyeOff, LogOut, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../context/CurrencyContext'

const CURRENCIES = [
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
]

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <p className="section-title" style={{ marginBottom: 20 }}>{title}</p>
      {children}
    </div>
  )
}

export default function Settings({ session, onBack }) {
  const meta = session.user.user_metadata || {}
  const { currency, setCurrency } = useCurrency()

  const [name, setName] = useState(meta.display_name || '')
  const [email, setEmail] = useState(session.user.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [nameStatus, setNameStatus] = useState(null)
  const [emailStatus, setEmailStatus] = useState(null)
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [loading, setLoading] = useState({})

  function setLoad(key, val) {
    setLoading(l => ({ ...l, [key]: val }))
  }

  async function saveName(e) {
    e.preventDefault()
    setNameStatus(null)
    setLoad('name', true)
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } })
    setLoad('name', false)
    setNameStatus(error ? { error: error.message } : { ok: 'Name updated.' })
  }

  async function saveEmail(e) {
    e.preventDefault()
    setEmailStatus(null)
    setLoad('email', true)
    const { error } = await supabase.auth.updateUser({ email })
    setLoad('email', false)
    setEmailStatus(error
      ? { error: error.message }
      : { ok: 'Check your new email address to confirm the change.' })
  }

  async function savePassword(e) {
    e.preventDefault()
    setPasswordStatus(null)
    if (password !== confirmPassword) return setPasswordStatus({ error: 'Passwords don\'t match.' })
    setLoad('password', true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoad('password', false)
    if (error) {
      setPasswordStatus({ error: error.message })
    } else {
      setPassword('')
      setConfirmPassword('')
      setPasswordStatus({ ok: 'Password updated.' })
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function deleteAccount() {
    // Requires a Supabase Edge Function or service role — surface a message
    // directing the user to contact support, or wire up an Edge Function.
    setLoad('delete', true)
    const { error } = await supabase.rpc('delete_user')
    setLoad('delete', false)
    if (error) {
      setDeleteConfirm(false)
      alert('Could not delete account: ' + error.message)
    } else {
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="page auth-page" style={{ maxWidth: 480 }}>
      <div className="auth-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
        </button>
        <div className="wordmark" style={{ margin: 0 }}>
          <PiggyBank size={17} />
          Save
        </div>
      </div>

      <h2 className="auth-title">Settings</h2>

      <Section title="Profile">
        <form onSubmit={saveName}>
          <Field label="Name">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First name or nickname"
              required
            />
          </Field>
          <StatusMsg status={nameStatus} />
          <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={loading.name}>
            {loading.name ? '...' : 'Save name'}
          </button>
        </form>
      </Section>

      <Section title="Email">
        <form onSubmit={saveEmail}>
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Field>
          <StatusMsg status={emailStatus} />
          <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={loading.email}>
            {loading.email ? '...' : 'Update email'}
          </button>
        </form>
      </Section>

      <Section title="Password">
        <form onSubmit={savePassword}>
          <Field label="New password">
            <div className="input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button type="button" className="input-eye" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password">
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Same again"
              minLength={6}
              required
            />
          </Field>
          <StatusMsg status={passwordStatus} />
          <button type="submit" className="btn" style={{ marginTop: 8 }} disabled={loading.password}>
            {loading.password ? '...' : 'Update password'}
          </button>
        </form>
      </Section>

      <Section title="Currency">
        <Field label="Display currency">
          <select
            className="field-select"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </Field>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8 }}>
          Changes how amounts are displayed. Deposits are stored as plain numbers.
        </p>
      </Section>

      <Section title="Account">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
          onClick={signOut}
        >
          <LogOut size={14} />
          Sign out
        </button>

        {!deleteConfirm ? (
          <button
            className="btn btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={14} />
            Delete account
          </button>
        ) : (
          <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--red)', marginBottom: 0 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              This permanently deletes your account and all saved goals. There's no undo.
            </p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteAccount} disabled={loading.delete}>
                {loading.delete ? '...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  if (status.ok) return <p style={{ fontSize: '0.8rem', color: 'var(--green)', marginTop: 8 }}>{status.ok}</p>
  if (status.error) return <p className="error">{status.error}</p>
  return null
}
