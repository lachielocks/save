import { useNavigate } from 'react-router-dom'
import { PiggyBank, CheckCircle } from 'lucide-react'
import { PageTransition } from '../App'
import Footer from './Footer'

export default function Confirmed() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="page auth-page">
        <div className="auth-header">
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={17} />
            Save
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <CheckCircle size={36} color="var(--green)" strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Email confirmed
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 28 }}>
            Thanks for confirming your email. Sign in to start saving.
          </p>
          <button className="btn" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

        <Footer />
      </div>
    </PageTransition>
  )
}
