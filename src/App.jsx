import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { AuthProvider, useAuth } from './context/AuthContext'
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

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.18, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RootRoute() {
  const [searchParams] = useSearchParams()
  const goalId = searchParams.get('goal')
  const { session, loading } = useAuth()

  if (loading) return null
  if (goalId) return <PublicGoal goalId={goalId} />
  if (session) return <Navigate to="/goals" replace />
  return <Landing />
}

// Listens to Supabase auth events and navigates accordingly
function AuthEventHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset')
      } else if (event === 'SIGNED_IN') {
        const hash = window.location.hash
        if (hash.includes('type=signup') || hash.includes('type=email_change')) {
          history.replaceState(null, '', window.location.pathname)
          navigate('/confirmed')
        } else {
          navigate('/goals')
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  const { session } = useAuth()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRoute />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/confirmed" element={<Confirmed />} />
        <Route path="/goals" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute><Dashboard showCreate /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  )
}

function AppWithAuth() {
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <CurrencyProvider session={session}>
      <BrowserRouter>
        <AuthEventHandler />
        <AnimatedRoutes />
      </BrowserRouter>
    </CurrencyProvider>
  )
}
