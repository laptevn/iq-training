export const registerPwa = () => {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)

      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    } catch (error) {
      console.warn('MindSprint offline mode could not be enabled.', error)
    }
  })
}
