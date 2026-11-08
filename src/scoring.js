export const SCORE_VERSION = 2

export const DIFFICULTY_WEIGHTS = {
  1: 0.7,
  2: 0.85,
  3: 1,
  4: 1.2,
  5: 1.45,
}

export const DOMAIN_BY_CATEGORY = {
  'Number series': 'Numerical',
  'Mixed series': 'Numerical',
  Arithmetic: 'Numerical',
  Classification: 'Numerical',
  Comparison: 'Numerical',
  'Letter logic': 'Verbal',
  Analogies: 'Verbal',
  'Visual sequence': 'Visual',
  'Pattern matrix': 'Visual',
  'Visual classification': 'Visual',
}

const clamp = (minimum, maximum, value) => Math.max(minimum, Math.min(maximum, value))

export const scoreSession = (answers, puzzles, elapsedSeconds) => {
  const answered = Object.keys(answers).length
  const correct = puzzles.reduce((sum, puzzle, index) => sum + (answers[index] === puzzle.answerIndex ? 1 : 0), 0)
  const accuracyRatio = answered ? correct / answered : 0
  const completion = answered / puzzles.length

  let earnedWeight = 0
  let possibleWeight = 0
  const domainTotals = {}

  puzzles.forEach((puzzle, index) => {
    const weight = DIFFICULTY_WEIGHTS[puzzle.difficulty] || 1
    const isCorrect = answers[index] === puzzle.answerIndex
    const isAnswered = answers[index] !== undefined
    const domain = DOMAIN_BY_CATEGORY[puzzle.category] || 'Other'
    possibleWeight += weight
    if (isCorrect) earnedWeight += weight
    domainTotals[domain] ||= { earned: 0, possible: 0, correct: 0, answered: 0, total: 0 }
    domainTotals[domain].possible += weight
    domainTotals[domain].total += 1
    if (isAnswered) domainTotals[domain].answered += 1
    if (isCorrect) {
      domainTotals[domain].earned += weight
      domainTotals[domain].correct += 1
    }
  })

  const mastery = possibleWeight ? earnedWeight / possibleWeight : 0
  const averageSeconds = answered ? elapsedSeconds / answered : Infinity
  const speed = clamp(0, 1, (24 - averageSeconds) / 12)
  const paceBonus = accuracyRatio >= 0.5 ? speed * completion * accuracyRatio * 5 : 0
  const iq = Math.round(clamp(70, 145, 70 + mastery * 70 + paceBonus))
  const domains = Object.fromEntries(Object.entries(domainTotals).map(([name, values]) => [name, {
    score: Math.round((values.earned / values.possible) * 100),
    correct: values.correct,
    answered: values.answered,
    total: values.total,
  }]))

  return {
    answered,
    correct,
    accuracy: Math.round(accuracyRatio * 100),
    weightedMastery: Math.round(mastery * 100),
    paceBonus: Math.round(paceBonus * 10) / 10,
    domains,
    iq,
    scoreVersion: SCORE_VERSION,
  }
}
