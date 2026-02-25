import { dispatchCustomEvent, listenEvent } from '@zoxon/eventor'

export { dispatchCustomEvent, listenEvent }

/**
 * Register a listener on a DOM element for a named event.
 * Returns a cleanup function, or undefined if element is null.
 */
export function listenElement<K extends keyof HTMLElementEventMap>(
  element: Element | null,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void
): (() => void) | undefined {
  if (!element) return undefined
  const h = handler as EventListener
  element.addEventListener(event, h)
  return () => element.removeEventListener(event, h)
}

/**
 * Dispatch a CustomEvent on a DOM element (bubbles + composed).
 * Silently skips if element is null.
 */
export function dispatchElement(
  element: Element | null,
  event: string,
  detail?: unknown
): void {
  if (!element) return
  element.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }))
}

/**
 * Manages event listeners and their cleanup.
 * Call destroy() to remove all registered listeners at once.
 */
export class EventController {
  #cleanups: Array<() => void> = []

  /**
   * Register a window custom event listener.
   * Automatically removed when destroy() is called.
   */
  on<K extends keyof WindowEventMap>(event: K, handler: (e: WindowEventMap[K]) => void): void {
    this.#cleanups.push(listenEvent(event, handler))
  }

  /**
   * Register a DOM element event listener.
   * If element is null, the call is silently skipped.
   * Automatically removed when destroy() is called.
   */
  listen<K extends keyof HTMLElementEventMap>(
    element: Element | null,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void
  ): void {
    const cleanup = listenElement(element, event, handler)
    if (cleanup) this.#cleanups.push(cleanup)
  }

  /**
   * Remove all registered listeners.
   */
  destroy(): void {
    for (const cleanup of this.#cleanups) cleanup()
    this.#cleanups = []
  }
}

declare global {
  interface WindowEventMap {
    'app:ready': CustomEvent<null>
    'app:setup-complete': CustomEvent<null>
    'component:inited': CustomEvent<string>
  }
}
