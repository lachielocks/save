import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import Landing from './components/Landing'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'
import './App.css'

const variants = {
  initial: (dir) => ({ opacity: 0, x: dir * 24 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -24 }),
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('landing') // 'landing' | 'signin' | 'signup'
  const [dir, setDir] = useState(1)

  function nav(to) {
    const order = ['landing', 'signin', 'signup']
    const from = order.indexOf(page)
    const toIdx = order.indexOf(to)
    setDir(toIdx >= from ? 1 : -1)
    setPage(to)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (session) {
    return <Dashboard session={session} />
  }

  return (
    <AnimatePresence mode="wait" custom={dir}>
      <motion.div
        key={page}
        custom={dir}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        {page === 'landing' && <Landing onSignIn={() => nav('signin')} onSignUp={() => nav('signup')} />}
        {page === 'signin' && <SignIn onSignUp={() => nav('signup')} onBack={() => nav('landing')} />}
        {page === 'signup' && <SignUp onSignIn={() => nav('signin')} onBack={() => nav('landing')} />}
      </motion.div>
    </AnimatePresence>
  )
}
