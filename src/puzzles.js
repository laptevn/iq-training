const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const shuffleWithSeed = (items, seed) => {
  const result = [...items]
  let state = seed + 1
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const makeOptions = (answer, distractors, seed) => {
  const values = [...new Set([answer, ...distractors])].slice(0, 4)
  let bump = 1
  while (values.length < 4) {
    const value = typeof answer === 'number' ? answer + bump * 3 : `${answer}${bump}`
    if (!values.includes(value)) values.push(value)
    bump += 1
  }
  const options = shuffleWithSeed(values, seed).map(String)
  return { options, answerIndex: options.indexOf(String(answer)) }
}

const tokenKey = (token) => `${token.shape}-${token.fill}-${token.rotation}-${token.count || 1}`

const makeVisualOptions = (answer, distractors, seed) => {
  const byKey = new Map([answer, ...distractors].map((item) => [tokenKey(item), item]))
  const optionVisuals = shuffleWithSeed([...byKey.values()].slice(0, 4), seed)
  return {
    optionVisuals,
    options: optionVisuals.map(tokenKey),
    answerIndex: optionVisuals.findIndex((item) => tokenKey(item) === tokenKey(answer)),
  }
}

const numberSequence = (n) => {
  const mode = n % 3
  const start = 2 + (n % 11)
  let values
  let answer
  let explanation
  if (mode === 0) {
    const gap = 2 + (Math.floor(n / 3) % 5)
    values = [start]
    for (let i = 0; i < 4; i += 1) values.push(values.at(-1) + gap + i * 2)
    answer = values.at(-1) + gap + 8
    explanation = `The gaps increase by 2: +${gap}, +${gap + 2}, +${gap + 4}, +${gap + 6}, +${gap + 8}.`
  } else if (mode === 1) {
    const add = 1 + (Math.floor(n / 3) % 4)
    values = [start]
    for (let i = 0; i < 4; i += 1) values.push(values.at(-1) * 2 + add)
    answer = values.at(-1) * 2 + add
    explanation = `Each term is doubled, then ${add} is added.`
  } else {
    const jump = 3 + (Math.floor(n / 3) % 5)
    values = [start]
    for (let i = 0; i < 4; i += 1) values.push(i % 2 === 0 ? values.at(-1) + jump : values.at(-1) * 2)
    answer = values.at(-1) + jump
    explanation = `The operations alternate: add ${jump}, then double.`
  }
  const { options, answerIndex } = makeOptions(answer, [answer - 2, answer + 2, answer + (mode + 1) * 3], n)
  return { prompt: 'What number completes the rule?', display: `${values.join('  ·  ')}  ·  ?`, options, answerIndex, explanation }
}

const alternating = (n) => {
  const a = 2 + (n % 9)
  const b = 31 + Math.floor(n / 9) * 4
  const da = 2 + (n % 4)
  const db = 2 + (Math.floor(n / 4) % 4)
  const values = [a, b, a + da, b - db, a + da * 2, b - db * 2]
  const answer = a + da * 3
  const { options, answerIndex } = makeOptions(answer, [b - db * 3, answer + da, answer + db], n + 101)
  return { prompt: 'Complete the two interwoven sequences.', display: `${values.join('  ·  ')}  ·  ?`, options, answerIndex, explanation: `Odd positions rise by ${da}; even positions fall by ${db}.` }
}

const letterSequence = (n) => {
  const first = n % 13
  const second = 25 - (n % 11)
  const forward = 1 + (Math.floor(n / 13) % 3)
  const backward = 1 + (Math.floor(n / 7) % 3)
  const values = [letters[first], letters[second], letters[(first + forward) % 26], letters[(second - backward + 26) % 26], letters[(first + forward * 2) % 26], letters[(second - backward * 2 + 26) % 26]]
  const answer = letters[(first + forward * 3) % 26]
  const { options, answerIndex } = makeOptions(answer, [letters[(first + forward * 4) % 26], letters[(second - backward * 3 + 26) % 26], letters[(first + forward * 3 + 1) % 26]], n + 202)
  return { prompt: 'Complete the interwoven letter pattern.', display: `${values.join('   ')}   ?`, options, answerIndex, explanation: `Odd-position letters move forward ${forward}; even-position letters move backward ${backward}.` }
}

const arithmetic = (n) => {
  const a = 3 + (n % 9)
  const b = 2 + (Math.floor(n / 9) % 6)
  const c = 2 + (n % 5)
  const d = 1 + (Math.floor(n / 5) % 4)
  const answer = a * b + c * d
  const { options, answerIndex } = makeOptions(answer, [(a + c) * b + d, a * (b + c) - d, a * b + c + d], n + 303)
  return { prompt: 'Solve the multi-step expression.', display: `${a} × ${b} + ${c} × ${d} = ?`, options, answerIndex, explanation: `Multiply both pairs first: ${a * b} + ${c * d} = ${answer}.` }
}

const analogySets = [
  ['Bird', 'nest', 'bee', 'hive'], ['Puppy', 'dog', 'kitten', 'cat'], ['Finger', 'hand', 'toe', 'foot'], ['Book', 'read', 'music', 'listen'],
  ['Knife', 'cut', 'pencil', 'write'], ['Winter', 'cold', 'summer', 'hot'], ['Author', 'novel', 'composer', 'symphony'], ['Eye', 'see', 'ear', 'hear'],
  ['Clock', 'time', 'thermometer', 'temperature'], ['Calf', 'cow', 'foal', 'horse'], ['Page', 'book', 'brick', 'wall'], ['Chef', 'kitchen', 'judge', 'courtroom'],
  ['Petal', 'flower', 'leaf', 'tree'], ['Key', 'lock', 'password', 'account'], ['Glove', 'hand', 'sock', 'foot'], ['Painter', 'canvas', 'writer', 'paper'],
  ['Island', 'ocean', 'oasis', 'desert'], ['Helmet', 'head', 'shoe', 'foot'],
]

const analogy = (n) => {
  const setIndex = n % analogySets.length
  const mode = Math.floor(n / analogySets.length) % 4
  const set = analogySets[setIndex]
  const layouts = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]]
  const [first, relation, subject, answerPosition] = layouts[mode]
  const answer = set[answerPosition]
  const distractors = analogySets.filter((_, i) => i !== setIndex).map((x) => x[answerPosition])
  const { options, answerIndex } = makeOptions(answer, shuffleWithSeed(distractors, n).slice(0, 3), n + 404)
  return { prompt: 'Complete the analogy.', display: `${set[first]} is to ${set[relation]} as ${set[subject]} is to…`, options, answerIndex, explanation: `${set[first]} relates to ${set[relation]} in the same way ${set[subject]} relates to ${answer}.` }
}

const oddOneOut = (n) => {
  const base = 3 + n
  const regular = [base * 2, base * 3, base * 5]
  const odd = base * 4 + 1
  const options = shuffleWithSeed([...regular, odd], n + 505).map(String)
  return { prompt: 'Which number breaks the divisibility rule?', display: 'Exactly three values share a hidden factor.', options, answerIndex: options.indexOf(String(odd)), explanation: `${regular.join(', ')} are divisible by ${base}; ${odd} is not.` }
}

const comparison = (n) => {
  const a = 3 + (n % 8)
  const b = 2 + (Math.floor(n / 8) % 5)
  const c = 1 + (n % 4)
  const left = a * b + c
  const delta = (n % 3) - 1
  const right = left + delta
  const answer = delta === 0 ? 'Equal' : delta < 0 ? 'Left is greater' : 'Right is greater'
  const options = shuffleWithSeed(['Left is greater', 'Right is greater', 'Equal', 'Cannot tell'], n + 606)
  return { prompt: 'Compare after solving both sides.', display: `${a} × ${b} + ${c}     ◇     ${right + b} − ${b}`, options, answerIndex: options.indexOf(answer), explanation: `The left side is ${left}; the right side is ${right}, so ${answer.toLowerCase()}.` }
}

const shapes = ['circle', 'square', 'triangle', 'diamond', 'arrow']
const token = (shape, rotation, fill, count = 1) => ({ shape, rotation: ((rotation % 360) + 360) % 360, fill, count })

const rotationPattern = (n) => {
  const shape = shapes[n % shapes.length]
  const step = [45, 90, 135][Math.floor(n / 5) % 3]
  const start = (Math.floor(n / 15) % 4) * 45
  const alternates = n >= 25
  const items = Array.from({ length: 4 }, (_, i) => token(shape, start + step * i, alternates && i % 2 ? 'outline' : 'solid'))
  const answer = token(shape, start + step * 4, 'solid')
  const choices = makeVisualOptions(answer, [token(shape, start + step * 3, answer.fill), token(shape, start + step * 4 + 45, answer.fill), token(shape, start + step * 4, 'outline')], n + 707)
  return { prompt: 'Which symbol continues the visual sequence?', display: `rotation:${items.map(tokenKey).join(',')}?`, ...choices, visual: { type: 'sequence', items }, explanation: `The symbol rotates ${step}° each step${alternates ? ' while fill alternates' : ''}.` }
}

const matrixPattern = (n) => {
  const shapeOffset = n % shapes.length
  const step = [45, 90][Math.floor(n / 5) % 2]
  const offset = (Math.floor(n / 10) % 4) * 45
  const count = 1 + Math.floor(n / 40)
  const makeCell = (position) => {
    const row = Math.floor(position / 3)
    const col = position % 3
    return token(shapes[(shapeOffset + row + col) % shapes.length], offset + row * 90 + col * step, (row + col) % 2 ? 'outline' : 'solid', count)
  }
  const all = Array.from({ length: 9 }, (_, i) => makeCell(i))
  const answer = all[8]
  const choices = makeVisualOptions(answer, [token(shapes[(shapeOffset + 3) % shapes.length], answer.rotation, answer.fill, count), token(answer.shape, answer.rotation + step, answer.fill, count), token(answer.shape, answer.rotation, answer.fill === 'solid' ? 'outline' : 'solid', count)], n + 808)
  return { prompt: 'Complete the pattern matrix.', display: `matrix:${all.slice(0, 8).map(tokenKey).join(',')}?`, ...choices, visual: { type: 'matrix', items: all.slice(0, 8) }, explanation: 'Across each row, shape and rotation advance together; fill alternates like a checkerboard.' }
}

const visualOddOne = (n) => {
  const shape = shapes[n % shapes.length]
  const start = (Math.floor(n / 5) % 8) * 45
  const fill = n >= 25 ? 'outline' : 'solid'
  const regular = [0, 1, 2].map((i) => token(shape, start + i * 90, fill, 1 + (n % 2)))
  const odd = token(shapes[(n + 1) % shapes.length], start + 270, fill, 1 + (n % 2))
  const optionVisuals = shuffleWithSeed([...regular, odd], n + 909)
  const options = optionVisuals.map(tokenKey)
  return { prompt: 'Which symbol breaks the visual rule?', display: `odd:${options.join(',')}`, options, optionVisuals, answerIndex: optionVisuals.findIndex((item) => tokenKey(item) === tokenKey(odd)), visual: { type: 'odd-one-out' }, explanation: 'Three symbols are the same shape shown at successive quarter-turns; one uses a different shape.' }
}

const families = [numberSequence, alternating, letterSequence, arithmetic, analogy, oddOneOut, comparison, rotationPattern, matrixPattern, visualOddOne]
const categories = ['Number series', 'Mixed series', 'Letter logic', 'Arithmetic', 'Analogies', 'Classification', 'Comparison', 'Visual sequence', 'Pattern matrix', 'Visual classification']

export const PUZZLES = Array.from({ length: 500 }, (_, index) => {
  const familyIndex = index % families.length
  const variant = Math.floor(index / families.length)
  return { id: `ms-${String(index + 1).padStart(3, '0')}`, category: categories[familyIndex], difficulty: 1 + (variant % 5), ...families[familyIndex](variant) }
})

export const getSessionPuzzles = (count = 50) => {
  const seed = Date.now() % 2147483647
  if (count !== 50) return shuffleWithSeed(PUZZLES, seed).slice(0, count)

  const balancedSelection = []
  categories.forEach((category, categoryIndex) => {
    for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
      const bucket = PUZZLES.filter((puzzle) => puzzle.category === category && puzzle.difficulty === difficulty)
      balancedSelection.push(shuffleWithSeed(bucket, seed + categoryIndex * 17 + difficulty)[0])
    }
  })
  return shuffleWithSeed(balancedSelection, seed + 997)
}
