import type { ComponentRootElement } from './types'
import { dispatchCustomEvent, dispatchElement, EventController } from './events'
import { getInstanceFromElement } from './helpers'

import {
  onAppReady,
  onSetupComplete,
  registerComponentSetup,
  setupIsComplete,
  unregisterComponentSetup,
} from './lifecycle'

export class Component {
  #name: string
  #events = new EventController()
  #startCallbacks: Array<() => void | Promise<void>> = []

  element: HTMLElement

  constructor(name: string, element: HTMLElement) {
    this.#name = name
    this.element = element

    if (this.#isInitialized()) return

    this.#setInitAttribute()

    onAppReady(() => void this.#runSetup().then(() => this.#runStart()))
  }

  async #runSetup(): Promise<void> {
    registerComponentSetup()
    try {
      await this.init()
      dispatchCustomEvent('component:inited', this.#name)
    } finally {
      unregisterComponentSetup()
    }
  }

  async #runStart(): Promise<void> {
    const run = async () => {
      await this.start()
      for (const cb of this.#startCallbacks) {
        await cb()
      }
      this.#startCallbacks = []
    }
    if (setupIsComplete()) {
      await run()
    } else {
      onSetupComplete(() => void run())
    }
  }

  #setInitAttribute(): void {
    this.element.setAttribute(`data-${this.#name}-inited`, 'true')
  }

  #isInitialized(): boolean {
    return !!this.element.getAttribute(`data-${this.#name}-inited`)
  }

  /**
   * Listen to a window custom event.
   * Automatically removed on destroy().
   */
  protected on<K extends keyof WindowEventMap>(event: K, handler: (e: WindowEventMap[K]) => void): void {
    this.#events.on(event, handler)
  }

  /**
   * Listen to a DOM element event.
   * If element is null, the call is silently skipped.
   * Automatically removed on destroy().
   */
  protected listen<K extends keyof HTMLElementEventMap>(
    element: Element | null,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void
  ): void {
    this.#events.listen(element, event, handler)
  }

  /**
   * Broadcast a window custom event.
   */
  protected emit<K extends keyof WindowEventMap>(
    event: K,
    detail: WindowEventMap[K] extends CustomEvent<infer T> ? T : never
  ): void {
    dispatchCustomEvent(event, detail)
  }

  /**
   * Dispatch a CustomEvent on a DOM element (bubbles by default).
   * If element is null, the call is silently skipped.
   */
  protected dispatch(element: Element | null, event: string, detail?: unknown): void {
    dispatchElement(element, event, detail)
  }

  get<E extends Element>(name: string, context?: Element): E | null {
    const selector = `[data-ref="${this.#name}:${name}"]`
    return (context ?? this.element).querySelector<E>(selector)
  }

  getAll<E extends Element>(name: string, context?: Element): E[] {
    const selector = `[data-ref="${this.#name}:${name}"]`
    return [...(context ?? this.element).querySelectorAll<E>(selector)]
  }

  getParent<E extends Element>(context: Element, name: string): E | null {
    return context.closest<E>(`[data-ref="${this.#name}:${name}"]`)
  }

  getInstance<T extends Component>(element: ComponentRootElement<T>): T | undefined {
    return getInstanceFromElement<T>(element)
  }

  /**
   * Schedule a callback to run in Phase 2, after all components have completed init().
   * Use this inside init() to write both phases in one method (Vue 3 setup style).
   */
  protected onStart(callback: () => void | Promise<void>): void {
    this.#startCallbacks.push(callback)
  }

  /**
   * Phase 1: declare listeners via this.on() / this.listen(), prepare state.
   * Called for all components before any start() is executed.
   */
  async init(): Promise<void> { }

  /**
   * Phase 2: dispatch events, start logic.
   * Called after all components have completed init() and registered listeners.
   */
  async start(): Promise<void> { }

  destroy(): void {
    this.#events.destroy()
    delete (this.element as ComponentRootElement<this>).__instance
  }
}
