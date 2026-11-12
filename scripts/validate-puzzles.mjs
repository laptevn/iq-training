import { getSessionPuzzles, PUZZLES } from '../src/puzzles.js'
import { SCORE_VERSION, scoreSession } from '../src/scoring.js'

const failures = []
const visualPuzzles = PUZZLES.filter((puzzle) => puzzle.visual)
if (PUZZLES.length !== 1000) failures.push(`Expected 1000 puzzles, got ${PUZZLES.length}`)
if (visualPuzzles.length !== 300) failures.push(`Expected 300 visual puzzles, got ${visualPuzzles.length}`)
if (new Set(PUZZLES.map((p) => p.id)).size !== 1000) failures.push('Puzzle IDs are not unique')
const catalogByCategory = Object.groupBy(PUZZLES, (puzzle) => puzzle.category)
if (Object.values(catalogByCategory).some((items) => items.length !== 100)) failures.push('Catalog is not balanced to 100 puzzles per category')
for (const [category, items] of Object.entries(catalogByCategory)) {
  const byDifficulty = Object.groupBy(items, (puzzle) => puzzle.difficulty)
  if (Object.values(byDifficulty).some((puzzles) => puzzles.length !== 20)) failures.push(`${category} is not balanced to 20 puzzles per difficulty`)
}
const puzzleContentKey = (puzzle) => [
  puzzle.prompt,
  puzzle.display,
  ...[...puzzle.options].sort(),
  puzzle.options[puzzle.answerIndex],
].join('|')
const uniquePuzzleContent = new Set(PUZZLES.map(puzzleContentKey))
if (uniquePuzzleContent.size !== PUZZLES.length) {
  failures.push(`Puzzle catalog contains ${PUZZLES.length - uniquePuzzleContent.size} duplicate puzzle(s) with different IDs`)
}
for (const puzzle of PUZZLES) {
  if (puzzle.options.length !== 4) failures.push(`${puzzle.id}: does not have 4 options`)
  if (puzzle.answerIndex < 0 || puzzle.answerIndex > 3) failures.push(`${puzzle.id}: invalid answer index`)
  if (!puzzle.explanation) failures.push(`${puzzle.id}: missing explanation`)
  if (puzzle.visual && puzzle.optionVisuals?.length !== 4) failures.push(`${puzzle.id}: visual puzzle does not have 4 visual answers`)
}

const session = getSessionPuzzles(50)
if (session.length !== 50) failures.push(`Expected 50 session puzzles, got ${session.length}`)
if (new Set(session.map((p) => p.id)).size !== session.length) failures.push('A session contains repeated puzzle IDs')
if (new Set(session.map(puzzleContentKey)).size !== session.length) failures.push('A session contains repeated puzzle content')
const categoryCounts = Object.groupBy(session, (puzzle) => puzzle.category)
if (Object.values(categoryCounts).some((items) => items.length !== 5)) failures.push('Session is not balanced to 5 questions per category')
const difficultyCounts = Object.groupBy(session, (puzzle) => puzzle.difficulty)
if (Object.values(difficultyCounts).some((items) => items.length !== 10)) failures.push('Session is not balanced to 10 questions per difficulty')

const perfectAnswers = Object.fromEntries(session.map((puzzle, index) => [index, puzzle.answerIndex]))
const perfectScore = scoreSession(perfectAnswers, session, 600)
if (perfectScore.iq !== 145) failures.push(`Expected perfect calibrated score of 145, got ${perfectScore.iq}`)
if (perfectScore.scoreVersion !== SCORE_VERSION) failures.push('Score version is missing or incorrect')
if (Object.keys(perfectScore.domains).length !== 3) failures.push('Expected numerical, verbal, and visual domain scores')

const easyAnswers = {}
const hardAnswers = {}
session.forEach((puzzle, index) => {
  if (puzzle.difficulty === 1) easyAnswers[index] = puzzle.answerIndex
  if (puzzle.difficulty === 5) hardAnswers[index] = puzzle.answerIndex
})
const easyScore = scoreSession(easyAnswers, session, 300)
const hardScore = scoreSession(hardAnswers, session, 300)
if (hardScore.iq <= easyScore.iq) failures.push('Hard correct answers are not weighted above easy correct answers')

if (failures.length) {
  console.error(failures.slice(0, 20).join('\n'))
  process.exit(1)
}

console.log(`Validated ${PUZZLES.length} unique puzzles across ${new Set(PUZZLES.map((p) => p.category)).size} categories.`)
