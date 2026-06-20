import { useNavigate } from 'react-router-dom'
import { PiggyBank, Target, TrendingDown, History } from 'lucide-react'
import { PageTransition } from '../App'
import Footer from './Footer'

const features = [
  {
    icon: Target,
    title: 'Set a goal',
    desc: 'Name your goal, set a target amount and a date you want to reach it by.',
  },
  {
    icon: TrendingDown,
    title: 'Weekly targets that adapt',
    desc: 'Save more one week? Your required weekly amount automatically drops for the weeks ahead.',
  },
  {
    icon: History,
    title: 'Track every deposit',
    desc: 'Log deposits with optional notes. See your full history and watch the progress bar climb.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="page landing-page">
        <nav className="landing-nav">
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={17} />
            Save
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => navigate('/login')}>
              Sign in
            </button>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => navigate('/signup')}>
              Get started
            </button>
          </div>
        </nav>

        <div className="hero">
          <h1 className="hero-title">Save smarter,<br />one week at a time.</h1>
          <p className="hero-sub">
            Set a savings goal and a deadline. Save tells you exactly how much to put away each week — and adjusts automatically when you get ahead.
          </p>
          <button className="btn hero-cta" onClick={() => navigate('/signup')}>
            Create a free account
          </button>
        </div>

        <div className="features">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature">
              <Icon size={18} color="var(--muted)" strokeWidth={1.5} />
              <div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Footer />
      </div>
    </PageTransition>
  )
}
