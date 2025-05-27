import type { AstroIntegration } from 'astro'
import type { ScopeSelector } from '../../core/helpers'

interface AstroIntegrationOptions {
  scope?: ScopeSelector
}

const astroIntegration = (options?: AstroIntegrationOptions): AstroIntegration => {
  const script = `import { initComponents } from '@zoxon/nux';

document.addEventListener("DOMContentLoaded", () => {
  initComponents(${JSON.stringify(options)});
});`

  return {
    name: 'components-integration',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('page', script)
      },
    },
  }
}

export default astroIntegration
