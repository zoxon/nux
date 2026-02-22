import { dispatchCustomEvent, listenEvent } from './events'

let isAppReady = false
let isSetupComplete = false
let setupCounter = 0

/**
 * Mark application as ready — triggers Phase 1 (setup) for all components.
 * Call this once the DOM is ready (e.g. on DOMContentLoaded).
 */
export function markAppReady(): void {
  if (isAppReady) return

  isAppReady = true
  dispatchCustomEvent('app:ready', null)

  if (setupCounter === 0) {
    markSetupComplete()
  }
}

function markSetupComplete(): void {
  if (isSetupComplete) return

  isSetupComplete = true
  dispatchCustomEvent('app:setup-complete', null)
}

/** @internal */
export function registerComponentSetup(): void {
  setupCounter++
}

/** @internal */
export function unregisterComponentSetup(): void {
  setupCounter--

  if (setupCounter === 0 && isAppReady) {
    markSetupComplete()
  }
}

/**
 * Subscribe to Phase 1 start. Callback fires immediately if app is already ready.
 */
export function onAppReady(callback: () => void): void {
  if (isAppReady) {
    callback()
    return
  }

  const off = listenEvent('app:ready', () => {
    off()
    callback()
  })
}

/**
 * Subscribe to Phase 2 start. Callback fires immediately if setup is already complete.
 */
export function onSetupComplete(callback: () => void): void {
  if (isSetupComplete) {
    callback()
    return
  }

  const off = listenEvent('app:setup-complete', () => {
    off()
    callback()
  })
}

/** @internal */
export function appIsReady(): boolean {
  return isAppReady
}

/** @internal */
export function setupIsComplete(): boolean {
  return isSetupComplete
}
