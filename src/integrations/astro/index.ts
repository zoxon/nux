import type { AstroIntegration } from 'astro'

const astroIntegration = (): AstroIntegration => {
  const script = `
import { markAppReady } from '@zoxon/nux';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => markAppReady(), { once: true });
} else {
  markAppReady();
}
`

  return {
    name: 'nux-integration',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('page', script)
      },
    },
  }
}

export default astroIntegration
