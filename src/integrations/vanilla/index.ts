import { markAppReady } from '../../core/lifecycle'

export function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => markAppReady(), { once: true })
  } else {
    markAppReady()
  }
}

export default init
