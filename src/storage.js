const HISTORY_KEY = 'mindsprint-history-v1'

export const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export const saveResult = (result) => {
  const history = [result, ...loadHistory()].slice(0, 100)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

export const clearHistory = () => localStorage.removeItem(HISTORY_KEY)
