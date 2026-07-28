import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, PiggyBank } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import GoalCard from './GoalCard'
import TiltedCard from './TiltedCard'
import { PageTransition } from '../App'
import Footer from './Footer'

export default function ArchivedGoals() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*, deposits(*), goal_notes(*)')
      .eq('user_id', session.user.id)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })

    if (data) {
      setGoals(data)
      setActiveGoalId(prev => {
        if (data.length === 0) return null
        if (prev && data.some(g => g.id === prev)) return prev
        return data[0].id
      })
    }
    setLoading(false)
  }

  async function handleRefresh() {
    await fetchGoals()
  }

  async function handleRemoved() {
    setActiveGoalId(null)
    await fetchGoals()
  }

  async function handleUnarchived() {
    navigate('/goals')
  }

  const activeGoal = goals.find(g => g.id === activeGoalId)

  return (
    <PageTransition>
      <div className="page">
        <div className="auth-header" style={{ marginBottom: 40 }}>
          <button className="back-btn" onClick={() => navigate('/settings')}>
            <ArrowLeft size={15} />
          </button>
          <div className="wordmark" style={{ margin: 0 }}>
            <PiggyBank size={17} />
            Save
          </div>
        </div>

        <h2 className="auth-title">Archived</h2>

        {!loading && goals.length === 0 && (
          <div className="no-goals">
            <p style={{ color: 'var(--muted)' }}>No archived goals.</p>
          </div>
        )}

        {goals.length > 0 && (
          <div className="tabs-bar">
            <div className="goal-tabs">
              {goals.map(g => (
                <button
                  key={g.id}
                  className={`goal-tab ${g.id === activeGoalId ? 'active' : ''}`}
                  onClick={() => setActiveGoalId(g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeGoal?.image_url && (
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
          {activeGoal && (
            <motion.div
              key={activeGoalId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GoalCard
                goal={activeGoal}
                onDeposit={handleRefresh}
                onDeleted={handleRemoved}
                onImageChange={handleRefresh}
                onNotesChange={handleRefresh}
                onUnarchived={handleUnarchived}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </PageTransition>
  )
}
