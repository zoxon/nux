import { describe, it, expect, vi, beforeEach } from 'vitest'
import init from './index'
import * as core from '../..'

describe('/integrations/vanilla', () => {
  const mockMap = [{ name: 'MockComponent', rootElement: document.createElement('div'), refs: [], dependencies: [] }]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls initComponents with default scope "page"', async () => {
    const spy = vi.spyOn(core, 'initComponents').mockResolvedValue(mockMap as any)

    const result = await init()

    expect(spy).toHaveBeenCalledWith({ scope: 'page' })
    expect(result).toBe(mockMap)
  })

  it('calls initComponents with custom scope', async () => {
    const scope = '#custom'
    const spy = vi.spyOn(core, 'initComponents').mockResolvedValue(mockMap as any)

    const result = await init({ scope })

    expect(spy).toHaveBeenCalledWith({ scope })
    expect(result).toBe(mockMap)
  })
})
