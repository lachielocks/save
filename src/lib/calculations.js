const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

export function weeklyRequired({ goalAmount, endDate, deposits }) {
  const now = new Date()
  const end = new Date(endDate)
  const weeksRemaining = Math.max(0, (end - now) / MS_PER_WEEK)
  const saved = totalSaved(deposits)
  const remaining = Math.max(0, goalAmount - saved)
  if (weeksRemaining <= 0) return 0
  return remaining / weeksRemaining
}

export function totalSaved(deposits) {
  return deposits.reduce((sum, d) => sum + d.amount, 0)
}

export function progressPercent(goalAmount, deposits) {
  if (!goalAmount) return 0
  return Math.min(100, (totalSaved(deposits) / goalAmount) * 100)
}

// Deposits made in the last 7 days
export function thisWeekDeposited(deposits) {
  const cutoff = Date.now() - MS_PER_WEEK
  return deposits
    .filter(d => new Date(d.created_at).getTime() >= cutoff)
    .reduce((sum, d) => sum + d.amount, 0)
}

// Projected completion date based on average weekly rate
export function projectedDate(goalAmount, deposits) {
  if (deposits.length < 2) return null
  const sorted = [...deposits].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const msElapsed = new Date(sorted.at(-1).created_at) - new Date(sorted[0].created_at)
  const weeksElapsed = msElapsed / MS_PER_WEEK
  if (weeksElapsed < 0.1) return null
  const saved = totalSaved(deposits)
  const avgPerWeek = saved / weeksElapsed
  if (avgPerWeek <= 0) return null
  const remaining = goalAmount - saved
  if (remaining <= 0) return null
  const weeksLeft = remaining / avgPerWeek
  const date = new Date()
  date.setTime(date.getTime() + weeksLeft * MS_PER_WEEK)
  return date
}

export function fmt(n, currency = 'AUD') {
  return n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 2 })
}
