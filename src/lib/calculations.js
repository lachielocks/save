/**
 * Given a goal total, start date, end date, and all deposits so far,
 * returns the required weekly deposit going forward.
 */
export function weeklyRequired({ goalAmount, startDate, endDate, deposits }) {
  const now = new Date()
  const end = new Date(endDate)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000

  const weeksRemaining = Math.max(0, (end - now) / msPerWeek)
  const totalSaved = deposits.reduce((sum, d) => sum + d.amount, 0)
  const remaining = Math.max(0, goalAmount - totalSaved)

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
