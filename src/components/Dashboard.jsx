import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, Settings, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { totalSaved, progressPercent } from '../lib/calculations'
import GoalCard from './GoalCard'
import NewGoalForm from './NewGoalForm'
import TiltedCard from './TiltedCard'
import { PageTransition } from '../App'
import Footer from './Footer'

const SORT_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'progress', label: 'Progress' },
]

function sortGoals(goals, sort) {
  return [...goals].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'deadline') return new Date(a.end_date) - new Date(b.end_date)
    if (sort === 'progress') {
      return progressPercent(a.goal_amount, a.deposits || []) - progressPercent(b.goal_amount, b.deposits || [])
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

export default function Dashboard({ showCreate = false }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [showNewGoal, setShowNewGoal] = useState(showCreate)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState(() => localStorage.getItem('goalSort') || 'created')

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*, deposits(*)')
      .eq('user_id', session.user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (data) {
      setGoals(data)
      if (data.length > 0 && !activeGoalId) setActiveGoalId(data[0].id)
    }
    setLoading(false)
  }

  function changeSort(s) {
    setSort(s)
    localStorage.setItem('goalSort', s)
  }

  async function handleNewGoal(goal) {
    await fetchGoals()
    setActiveGoalId(goal.id)
    setShowNewGoal(false)
    navigate('/goals', { replace: true })
  }

  async function handleDeposit() { await fetchGoals() }

  async function handleDeleted() {
    setActiveGoalId(null)
    await fetchGoals()
  }

  const sorted = sortGoals(goals, sort)
  const activeGoal = goals.find(g => g.id === activeGoalId)

  const touchStartX = useRef(null)
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    const idx = sorted.findIndex(g => g.id === activeGoalId)
    if (dx < 0 && idx < sorted.length - 1) setActiveGoalId(sorted[idx + 1].id)
    if (dx > 0 && idx > 0) setActiveGoalId(sorted[idx - 1].id)
  }

  return (
    <PageTransition>
      <div className="page">
        <div className="topbar">
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={18} />
            Save
          </div>
          <button className="signout" onClick={() => navigate('/settings')}>
            <Settings size={14} />
          </button>
        </div>

        {!loading && goals.length === 0 && !showNewGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="no-goals">
            <p style={{ marginBottom: 8 }}>
              {session.user.user_metadata?.display_name
                ? `Hey ${session.user.user_metadata.display_name} —`
                : 'Hey —'}
            </p>
            <p style={{ marginBottom: 24, color: 'var(--muted)' }}>No savings goals yet.</p>
            <button className="btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/create')}>
              Create your first goal
            </button>
          </motion.div>
        )}

        {goals.length > 0 && (
          <div className="tabs-bar">
            <div className="goal-tabs">
              {sorted.map(g => (
                <button
                  key={g.id}
                  className={`goal-tab ${g.id === activeGoalId ? 'active' : ''}`}
                  onClick={() => { setActiveGoalId(g.id); setShowNewGoal(false); navigate('/goals', { replace: true }) }}
                >
                  {g.name}
                </button>
              ))}
              <button className="goal-tab" onClick={() => navigate('/create')} title="New goal">
                <Plus size={13} />
              </button>
            </div>
            <select
              className="sort-select"
              value={sort}
              onChange={e => changeSort(e.target.value)}
              title="Sort goals"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence mode="wait">
          {activeGoal?.image_url && !showNewGoal && (
            <motion.div
              key={`img-${activeGoalId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 12 }}
            >
              <TiltedCard
                imageSrc={activeGoal.image_url}
                altText={activeGoal.name}
                captionText={activeGoal.name}
                containerHeight="260px"
                containerWidth="100%"
                imageHeight="220px"
                imageWidth="220px"
                rotateAmplitude={10}
                scaleOnHover={1.08}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={
                  <span className="tilted-card-overlay-text">{activeGoal.name}</span>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showNewGoal ? (
            <motion.div
              key="new-goal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <NewGoalForm
                userId={session.user.id}
                onCreated={handleNewGoal}
                onCancel={() => { setShowNewGoal(false); navigate('/goals', { replace: true }) }}
              />
            </motion.div>
          ) : activeGoal ? (
            <motion.div
              key={activeGoalId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GoalCard
                goal={activeGoal}
                onDeposit={handleDeposit}
                onDeleted={handleDeleted}
                onImageChange={fetchGoals}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        </div>
        <Footer />
      </div>
    </PageTransition>
  )
}
