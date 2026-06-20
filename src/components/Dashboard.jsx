import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, Settings, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import GoalCard from './GoalCard'
import NewGoalForm from './NewGoalForm'

export default function Dashboard({ session, onSettings }) {
  const [goals, setGoals] = useState([])
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*, deposits(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setGoals(data)
      if (data.length > 0 && !activeGoalId) setActiveGoalId(data[0].id)
    }
    setLoading(false)
  }

  async function handleNewGoal(goal) {
    await fetchGoals()
    setActiveGoalId(goal.id)
    setShowNewGoal(false)
  }

  async function handleDeposit() {
    await fetchGoals()
  }

  async function handleDeleted() {
    setActiveGoalId(null)
    await fetchGoals()
  }

  const activeGoal = goals.find(g => g.id === activeGoalId)

  return (
    <div className="page">
      <div className="topbar">
        <div className="wordmark" style={{ margin: 0 }}>
          <PiggyBank size={18} />
          Save
        </div>
        <button className="signout" onClick={onSettings}>
          <Settings size={14} />
        </button>
      </div>

      {!loading && goals.length === 0 && !showNewGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="no-goals"
        >
          <p style={{ marginBottom: 8 }}>
            {session.user.user_metadata?.display_name
              ? `Hey ${session.user.user_metadata.display_name} —`
              : 'Hey —'}
          </p>
          <p style={{ marginBottom: 24, color: 'var(--muted)' }}>No savings goals yet.</p>
          <button className="btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setShowNewGoal(true)}>
            Create your first goal
          </button>
        </motion.div>
      )}

      {goals.length > 0 && (
        <div className="goal-tabs">
          {goals.map(g => (
            <button
              key={g.id}
              className={`goal-tab ${g.id === activeGoalId ? 'active' : ''}`}
              onClick={() => { setActiveGoalId(g.id); setShowNewGoal(false) }}
            >
              {g.name}
            </button>
          ))}
          <button
            className="goal-tab"
            onClick={() => setShowNewGoal(true)}
            title="New goal"
          >
            <Plus size={13} />
          </button>
        </div>
      )}

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
              onCancel={() => setShowNewGoal(false)}
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
            <GoalCard goal={activeGoal} onDeposit={handleDeposit} onDeleted={handleDeleted} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
