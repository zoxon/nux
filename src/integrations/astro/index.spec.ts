import { describe, it, expect, vi } from 'vitest'
import astroIntegration from './index'

describe('/integrations/astro', () => {
  it('returns an AstroIntegration with name and hooks', () => {
    const integration = astroIntegration()

    expect(integration.name).toBe('components-integration')
    expect(typeof integration.hooks['astro:config:setup']).toBe('function')
  })

  it('injects correct script with default options', () => {
    const injectScript = vi.fn()

    const integration = astroIntegration()
    integration.hooks['astro:config:setup']({ injectScript } as any)

    expect(injectScript).toHaveBeenCalledTimes(1)
    expect(injectScript).toHaveBeenCalledWith('page', expect.stringContaining('initComponents'))

    const [_, injected] = injectScript.mock.calls[0]
    const expectedInject = `import { initComponents } from '@zoxon/nux';

document.addEventListener("DOMContentLoaded", () => {
  initComponents(undefined);
});`
    expect(injected).toContain(expectedInject)
    expect(injected).toContain('document.addEventListener("DOMContentLoaded"')
  })

  it('injects script with custom scope option', () => {
    const injectScript = vi.fn()

    const integration = astroIntegration({ scope: '#main' })
    integration.hooks['astro:config:setup']({ injectScript } as any)

    const [_, injected] = injectScript.mock.calls[0]
    expect(injected).toContain(`initComponents({"scope":"#main"})`)
  })
})
