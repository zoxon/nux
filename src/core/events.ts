export { dispatchCustomEvent, listenEvent } from '@zoxon/eventor'

declare global {
  interface WindowEventMap {
    'app:ready': CustomEvent<null>
    'app:setup-complete': CustomEvent<null>
    'component:inited': CustomEvent<string>
  }
}
