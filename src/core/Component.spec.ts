import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentOptions } from './types'
import { Component } from './Component'

class TestComponent extends Component<{ count: number }> {
  override async init() {
    this.data.count = 42
  }
}

describe('core/Component', () => {
  let element: HTMLElement
  let refs: { name: string; element: HTMLElement }[]
  let options: Record<string, any>

  beforeEach(() => {
    element = document.createElement('div')
    options = { foo: 'bar' }
    refs = [
      { name: 'Test:button', element: document.createElement('button') },
      { name: 'Test:input', element: document.createElement('input') },
      { name: 'Test:button', element: document.createElement('button') },
    ]
  })

  function createInstance(opts: Partial<ComponentOptions<{ count: number }>> = {}) {
    return new TestComponent({
      name: 'Test',
      element,
      references: refs,
      options,
      data: { count: 0 },
      ...opts
    })
  }

  it('assigns properties from constructor', () => {
    const comp = createInstance()
    expect(comp.name).toBe('Test')
    expect(comp.element).toBe(element)
    expect(comp.options).toEqual({ foo: 'bar' })
    expect(comp.data).toEqual({ count: 0 })
    expect(comp.rawRefs).toHaveLength(3)
  })

  it('calls buildCache and bindEvents', () => {
    const buildSpy = vi.spyOn(TestComponent.prototype, 'buildCache')
    const bindSpy = vi.spyOn(TestComponent.prototype, 'bindEvents')
    createInstance()
    expect(buildSpy).toHaveBeenCalledOnce()
    expect(bindSpy).toHaveBeenCalledOnce()
  })

  it('sets __instance on element', () => {
    const comp = createInstance()
    expect((element as any).__instance).toBe(comp)
  })

  it('destroys the component and clears __instance', () => {
    const comp = createInstance()
    comp.destroy()
    expect((element as any).__instance).toBeUndefined()
  })

  it('get returns a single element by name', () => {
    const comp = createInstance()
    const button = comp.get<HTMLButtonElement>('button')
    expect(button?.tagName).toBe('BUTTON')
  })

  it('get returns undefined for missing ref', () => {
    const comp = createInstance()
    expect(comp.get('nonexistent')).toBeUndefined()
  })

  it('getAll returns all matching elements', () => {
    const comp = createInstance()
    const buttons = comp.getAll<HTMLButtonElement>('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].tagName).toBe('BUTTON')
  })

  it('init modifies data', () => {
    const comp = createInstance()
    comp.init()
    expect(comp.data.count).toBe(42)
  })
})
