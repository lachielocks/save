import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { CurrencyProvider } from './context/CurrencyContext'
import Landing from './components/Landing'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Confirmed from './components/Confirmed'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import PublicGoal from './components/PublicGoal'
import './App.css'

const PAGE_ORDER = ['landing', 'signin', 'signup', 'forgot', 'confirmed', 'reset', 'dashboard', 'settings']

const variants = {
  initial: (dir) => ({ opacity: 0, x: dir * 28 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -28 }),
}

// Check for public goal share link
const sharedGoalId = new URLSearchParams(window.location.search).get('goal')

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('landing')
  const [dir, setDir] = useState(1)

  function nav(to) {
    const from = PAGE_ORDER.indexOf(page)
    const toIdx = PAGE_ORDER.indexOf(to)
    setDir(toIdx >= from ? 1 : -1)
    setPage(to)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') {
        setDir(1); setPage('reset')
      } else if (event === 'SIGNED_IN') {
        const hash = window.location.hash
        if (hash.includes('type=signup') || hash.includes('type=email_change')) {
          history.replaceState(null, '', window.location.pathname)
          setDir(1); setPage('confirmed')
        } else {
          setDir(1); setPage('dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        setDir(-1); setPage('landing')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Public share view — no auth required
  if (sharedGoalId) return <PublicGoal goalId={sharedGoalId} />

  if (loading) return null

  const currentPage = session && page === 'landing' ? 'dashboard' : page

  return (
    <CurrencyProvider session={session}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={currentPage}
          custom={dir}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {currentPage === 'landing'   && <Landing onSignIn={() => nav('signin')} onSignUp={() => nav('signup')} />}
          {currentPage === 'signin'    && <SignIn onSignUp={() => nav('signup')} onBack={() => nav('landing')} onForgot={() => nav('forgot')} />}
          {currentPage === 'signup'    && <SignUp onSignIn={() => nav('signin')} onBack={() => nav('landing')} />}
          {currentPage === 'forgot'    && <ForgotPassword onBack={() => nav('signin')} />}
          {currentPage === 'reset'     && <ResetPassword onDone={() => nav('signin')} />}
          {currentPage === 'confirmed' && <Confirmed onSignIn={() => nav('signin')} />}
          {currentPage === 'dashboard' && <Dashboard session={session} onSettings={() => nav('settings')} />}
          {currentPage === 'settings'  && <Settings session={session} onBack={() => nav('dashboard')} />}
        </motion.div>
      </AnimatePresence>
    </CurrencyProvider>
  )
}
