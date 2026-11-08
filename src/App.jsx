import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Brain, Check, Clock3, Flame, Home, RotateCcw, Sparkles, Target, Trash2, X } from 'lucide-react'
import { getSessionPuzzles } from './puzzles.js'
import { SCORE_VERSION, scoreSession } from './scoring.js'
import { clearHistory, loadHistory, saveResult } from './storage.js'

const SESSION_SECONDS = 15 * 60

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const shortDate = (iso) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso))

function Brand({ compact = false }) {
  return <div className="brand"><span className="brand-mark"><Brain size={compact ? 18 : 21} /></span><span>MindSprint</span></div>
}

function BottomNav({ page, setPage }) {
  return <nav className="bottom-nav" aria-label="Main navigation">
    <button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}><Home /><span>Train</span></button>
    <button className={page === 'history' ? 'active' : ''} onClick={() => setPage('history')}><BarChart3 /><span>Progress</span></button>
  </nav>
}

function HomeScreen({ history, startSession, setPage }) {
  const calibratedHistory = history.filter((entry) => entry.scoreVersion === SCORE_VERSION)
  const best = calibratedHistory.length ? Math.max(...calibratedHistory.map((x) => x.iq)) : null
  const latest = history[0]
  return <main className="shell home-screen">
    <header className="topbar"><Brand /><button className="icon-button" aria-label="View progress" onClick={() => setPage('history')}><BarChart3 /></button></header>
    <section className="hero">
      <div className="eyebrow"><Sparkles size={14} /> Daily mental workout</div>
      <h1>Think sharper.<br /><em>One sprint at a time.</em></h1>
      <p>Train pattern recognition, logic, and speed with a focused 15-minute challenge.</p>
      <button className="primary big" onClick={startSession}>Start a sprint <ArrowRight /></button>
      <span className="microcopy">50 puzzles · 15 minutes · no account needed</span>
    </section>

    <section className="stats-row" aria-label="Overview">
      <article><span className="stat-icon coral"><Flame /></span><div><strong>{history.length}</strong><span>Sprints</span></div></article>
      <article><span className="stat-icon blue"><Target /></span><div><strong>{latest ? `${latest.accuracy}%` : '—'}</strong><span>Last accuracy</span></div></article>
      <article><span className="stat-icon yellow"><Brain /></span><div><strong>{best || '—'}</strong><span>Personal best</span></div></article>
    </section>

    <section className="section-head"><div><span className="kicker">HOW IT WORKS</span><h2>Your daily brain circuit</h2></div></section>
    <section className="steps">
      <article><span>01</span><div><h3>Spot the pattern</h3><p>Work through varied number, letter, verbal, and logic puzzles.</p></div></article>
      <article><span>02</span><div><h3>Beat the clock</h3><p>Move quickly, skip when stuck, and answer as many as you can.</p></div></article>
      <article><span>03</span><div><h3>Track your edge</h3><p>See your estimated score and follow your trend across sessions.</p></div></article>
    </section>
    <p className="disclaimer">MindSprint is a training tool, not a standardized clinical IQ test.</p>
  </main>
}

const tokenLabel = (token) => `${token.count > 1 ? `${token.count} ` : ''}${token.fill} ${token.shape}${token.count > 1 ? 's' : ''}, rotated ${token.rotation} degrees`

function ShapeSvg({ token }) {
  const common = { fill: token.fill === 'solid' ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinejoin: 'round' }
  return <svg viewBox="0 0 48 48" style={{ transform: `rotate(${token.rotation}deg)` }} aria-hidden="true">
    {token.shape === 'circle' && <circle cx="24" cy="24" r="15" {...common} />}
    {token.shape === 'square' && <rect x="10" y="10" width="28" height="28" rx="2" {...common} />}
    {token.shape === 'triangle' && <polygon points="24,7 42,39 6,39" {...common} />}
    {token.shape === 'diamond' && <polygon points="24,5 43,24 24,43 5,24" {...common} />}
    {token.shape === 'arrow' && <path d="M24 5 L42 23 L32 23 L32 42 L16 42 L16 23 L6 23 Z" {...common} />}
    <circle cx="24" cy="13" r="2.8" fill="var(--shape-cutout, #fff)" stroke="none" />
  </svg>
}

function VisualToken({ token }) {
  return <div className="visual-token" role="img" aria-label={tokenLabel(token)}>
    {Array.from({ length: token.count || 1 }, (_, i) => <ShapeSvg token={token} key={i} />)}
  </div>
}

function VisualPuzzle({ visual }) {
  if (visual.type === 'sequence') return <div className="visual-sequence">
    {visual.items.map((item, i) => <VisualToken token={item} key={i} />)}
    <div className="missing-token">?</div>
  </div>
  if (visual.type === 'matrix') return <div className="visual-matrix">
    {visual.items.map((item, i) => <div className="matrix-cell" key={i}><VisualToken token={item} /></div>)}
    <div className="matrix-cell missing-token">?</div>
  </div>
  return <div className="visual-hint"><Sparkles /><span>Compare shape, rotation, fill, and count.</span></div>
}

function SessionScreen({ finishSession, exitSession }) {
  const [puzzles] = useState(() => getSessionPuzzles())
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS)
  const [showExit, setShowExit] = useState(false)
  const puzzle = puzzles[index]

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) finishSession(answers, puzzles, SESSION_SECONDS)
  }, [secondsLeft])

  const complete = () => finishSession(answers, puzzles, SESSION_SECONDS - secondsLeft)
  const choose = (answerIndex) => setAnswers((current) => ({ ...current, [index]: answerIndex }))

  return <main className="session-screen">
    <header className="session-topbar">
      <button className="icon-button" onClick={() => setShowExit(true)} aria-label="Exit sprint"><X /></button>
      <Brand compact />
      <div className={`timer ${secondsLeft < 60 ? 'urgent' : ''}`}><Clock3 /> {formatTime(Math.max(0, secondsLeft))}</div>
    </header>
    <div className="progress-line"><span style={{ width: `${((index + 1) / puzzles.length) * 100}%` }} /></div>
    <section className="quiz-wrap">
      <div className="quiz-meta"><span>QUESTION {index + 1} OF {puzzles.length}</span><span>{puzzle.category}</span></div>
      <article className="question-card">
        <div className="difficulty" aria-label={`Difficulty ${puzzle.difficulty} out of 5`}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < puzzle.difficulty ? 'filled' : ''} />)}</div>
        <h1>{puzzle.prompt}</h1>
        <div className={`puzzle-display ${puzzle.visual ? 'visual-display' : ''}`}>{puzzle.visual ? <VisualPuzzle visual={puzzle.visual} /> : puzzle.display}</div>
        <div className="answers">
          {puzzle.options.map((option, answerIndex) => <button key={option} aria-label={puzzle.optionVisuals ? `Option ${lettersFor(answerIndex)}: ${tokenLabel(puzzle.optionVisuals[answerIndex])}` : undefined} className={`${answers[index] === answerIndex ? 'selected' : ''} ${puzzle.optionVisuals ? 'visual-answer' : ''}`} onClick={() => choose(answerIndex)}><span>{lettersFor(answerIndex)}</span>{puzzle.optionVisuals ? <VisualToken token={puzzle.optionVisuals[answerIndex]} /> : option}<Check /></button>)}
        </div>
      </article>
      <div className="session-actions">
        <button className="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft /> Back</button>
        {index < puzzles.length - 1
          ? <button className="primary" onClick={() => setIndex(index + 1)}>{answers[index] === undefined ? 'Skip' : 'Next'} <ArrowRight /></button>
          : <button className="primary" onClick={complete}>Finish <Check /></button>}
      </div>
      <button className="finish-early" onClick={complete}>Finish sprint early</button>
    </section>
    {showExit && <div className="modal-backdrop"><div className="modal"><h2>Leave this sprint?</h2><p>Your current answers won’t be saved.</p><div><button className="secondary" onClick={() => setShowExit(false)}>Keep going</button><button className="danger" onClick={exitSession}>Leave</button></div></div></div>}
  </main>
}

const lettersFor = (index) => ['A', 'B', 'C', 'D'][index]

function ResultsScreen({ result, previous, goHome, startSession, setPage }) {
  const delta = previous ? result.iq - previous.iq : null
  return <main className="shell result-screen">
    <header className="topbar"><Brand /></header>
    <section className="result-hero">
      <div className="burst"><Sparkles /></div>
      <span className="kicker">SPRINT COMPLETE</span>
      <h1>Nice work — you kept your mind moving.</h1>
      <div className="score-ring"><div><span>ESTIMATED</span><strong>{result.iq}</strong><small>IQ RANGE</small></div></div>
      <p className="estimate-note">Calibrated training estimate based on difficulty-weighted mastery, completion, and accurate pace.</p>
      {delta !== null && <div className={`delta ${delta >= 0 ? 'positive' : ''}`}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} points vs. your last sprint</div>}
    </section>
    <section className="result-grid">
      <article><Target /><strong>{result.accuracy}%</strong><span>Accuracy</span></article>
      <article><Check /><strong>{result.correct}/{result.answered}</strong><span>Correct</span></article>
      <article><Clock3 /><strong>{formatTime(result.elapsedSeconds)}</strong><span>Time used</span></article>
    </section>
    {result.domains && <section className="domain-card">
      <div className="domain-head"><div><span className="kicker">ABILITY PROFILE</span><h2>How you performed</h2></div><span>{result.weightedMastery}% weighted mastery</span></div>
      {['Numerical', 'Verbal', 'Visual'].filter((name) => result.domains[name]).map((name) => {
        const domain = result.domains[name]
        return <div className="domain-row" key={name}>
          <div><strong>{name}</strong><span>{domain.correct}/{domain.total} correct</span></div>
          <div className="domain-track"><i style={{ width: `${domain.score}%` }} /></div>
          <b>{domain.score}%</b>
        </div>
      })}
    </section>}
    <section className="result-actions"><button className="primary big" onClick={startSession}><RotateCcw /> Sprint again</button><button className="secondary big" onClick={() => setPage('history')}><BarChart3 /> View progress</button><button className="text-button" onClick={goHome}>Back home</button></section>
  </main>
}

function HistoryScreen({ history, setHistory, setPage }) {
  const calibratedHistory = history.filter((entry) => entry.scoreVersion === SCORE_VERSION)
  const legacyCount = history.length - calibratedHistory.length
  const chronological = [...calibratedHistory].reverse().slice(-10)
  const max = Math.max(145, ...chronological.map((x) => x.iq))
  const min = Math.min(65, ...chronological.map((x) => x.iq))
  const clear = () => {
    if (window.confirm('Delete all locally saved sprint history?')) { clearHistory(); setHistory([]) }
  }
  return <main className="shell history-screen">
    <header className="topbar"><Brand /><button className="icon-button" onClick={clear} aria-label="Clear history" disabled={!history.length}><Trash2 /></button></header>
    <section className="history-title"><span className="kicker">YOUR PROGRESS</span><h1>Small gains add up.</h1><p>Every sprint gives you another signal. Focus on the trend, not a single score.</p></section>
    {calibratedHistory.length ? <>
      <section className="chart-card">
        <div className="chart-head"><div><span>ESTIMATED SCORE</span><strong>{calibratedHistory[0].iq}</strong></div><span>Last {chronological.length} sprints</span></div>
        <div className="bar-chart" aria-label="Score history chart">{chronological.map((entry, i) => <div key={entry.id} className="bar-slot"><i style={{ height: `${24 + ((entry.iq - min) / (max - min)) * 72}%` }}><b>{entry.iq}</b></i><span>{i === chronological.length - 1 ? 'Now' : shortDate(entry.date)}</span></div>)}</div>
      </section>
      <section className="history-list"><div className="section-head"><h2>Recent calibrated sprints</h2></div>{calibratedHistory.slice(0, 8).map((entry) => <article key={entry.id}><div className="history-score">{entry.iq}</div><div><strong>{new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(entry.date))}</strong><span>{entry.correct} correct · {entry.accuracy}% accuracy</span></div><span>{formatTime(entry.elapsedSeconds)}</span></article>)}</section>
      {legacyCount > 0 && <p className="legacy-note">{legacyCount} older {legacyCount === 1 ? 'session uses' : 'sessions use'} the previous scoring model and {legacyCount === 1 ? 'is' : 'are'} excluded from this trend.</p>}
    </> : <section className="empty-state"><span><BarChart3 /></span><h2>Your calibrated trend starts here</h2><p>Complete a new sprint to unlock difficulty-weighted scores and ability insights.{legacyCount > 0 ? ` ${legacyCount} older sessions remain stored but are not comparable.` : ''}</p><button className="primary" onClick={() => setPage('home')}>Start training <ArrowRight /></button></section>}
    <BottomNav page="history" setPage={setPage} />
  </main>
}

export default function App() {
  const [page, setPage] = useState('home')
  const [history, setHistory] = useState(() => loadHistory())
  const [result, setResult] = useState(null)
  const previous = result ? history.find((entry) => entry.id !== result.id && entry.scoreVersion === result.scoreVersion) || null : history.find((entry) => entry.scoreVersion === SCORE_VERSION) || null

  const startSession = () => { window.scrollTo(0, 0); setPage('session') }
  const finishSession = (answers, puzzles, elapsedSeconds) => {
    const scored = scoreSession(answers, puzzles, elapsedSeconds)
    const completed = { ...scored, id: crypto.randomUUID(), date: new Date().toISOString(), elapsedSeconds }
    setResult(completed)
    setHistory(saveResult(completed))
    window.scrollTo(0, 0)
    setPage('results')
  }

  if (page === 'session') return <SessionScreen finishSession={finishSession} exitSession={() => setPage('home')} />
  if (page === 'results' && result) return <ResultsScreen result={result} previous={previous} goHome={() => setPage('home')} startSession={startSession} setPage={setPage} />
  if (page === 'history') return <HistoryScreen history={history} setHistory={setHistory} setPage={setPage} />
  return <><HomeScreen history={history} startSession={startSession} setPage={setPage} /><BottomNav page="home" setPage={setPage} /></>
}

