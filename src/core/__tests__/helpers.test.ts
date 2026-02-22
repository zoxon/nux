import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emitEvent, onEvent } from '../helpers'

// ─── onEvent ─────────────────────────────────────────────────────────────────

describe('onEvent', () => {
  it('registers window event listener and returns cleanup', () => {
    const handler = vi.fn()
    const cleanup = onEvent('component:inited', handler)

    expect(typeof cleanup).toBe('function')
    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce()

    cleanup?.()
    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })

  it('registers DOM element listener and returns cleanup', () => {
    const el = document.createElement('button')
    const handler = vi.fn()
    const cleanup = onEvent(el, 'click', handler)

    expect(typeof cleanup).toBe('function')
    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce()

    cleanup?.()
    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })

  it('returns undefined for null element', () => {
    const cleanup = onEvent(null, 'click', vi.fn())
    expect(cleanup).toBeUndefined()
  })
})

// ─── emitEvent ───────────────────────────────────────────────────────────────

describe('emitEvent', () => {
  it('dispatches a window custom event', () => {
    const handler = vi.fn()
    window.addEventListener('component:inited', handler)

    emitEvent('component:inited', 'test-component')

    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('component:inited', handler)
  })

  it('dispatches a custom event on an element', () => {
    const el = document.createElement('div')
    const handler = vi.fn()
    el.addEventListener('custom:event', handler)

    emitEvent(el, 'custom:event', { payload: 42 })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('dispatches element events with bubbles and composed', () => {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)
    document.body.appendChild(parent)

    const handler = vi.fn()
    parent.addEventListener('custom:bubble', handler)

    emitEvent(child, 'custom:bubble', null)
    expect(handler).toHaveBeenCalledOnce()

    document.body.removeChild(parent)
  })

  it('skips silently for null element', () => {
    expect(() => emitEvent(null, 'custom:event')).not.toThrow()
  })
})

// ─── createInstance / initComponent ──────────────────────────────────────────

describe('createInstance', () => {
  let createInstance: typeof import('../helpers').createInstance
  let Component: typeof import('../Component').Component

  beforeEach(async () => {
    vi.resetModules()
    const [helpersMod, compMod] = await Promise.all([
      import('../helpers'),
      import('../Component'),
    ])
    createInstance = helpersMod.createInstance
    Component = compMod.Component
  })

  it('creates instance and stores it on element.__instance', () => {
    const el = document.createElement('div')
    class Foo extends Component { }

    const instance = createInstance(el, 'foo', Foo)

    expect(instance).toBeInstanceOf(Foo)
    expect(instance.element).toBe(el)
  })

  it('returns existing instance on subsequent calls', () => {
    const el = document.createElement('div')
    class Foo extends Component { }

    const first = createInstance(el, 'foo', Foo)
    const second = createInstance(el, 'foo', Foo)

    expect(first).toBe(second)
  })
})

describe('initComponent', () => {
  let initComponent: typeof import('../helpers').initComponent
  let Component: typeof import('../Component').Component

  beforeEach(async () => {
    vi.resetModules()
    const [helpersMod, compMod] = await Promise.all([
      import('../helpers'),
      import('../Component'),
    ])
    initComponent = helpersMod.initComponent
    Component = compMod.Component
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('finds all [data-component="name"] elements and creates instances', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    a.dataset.component = 'counter'
    b.dataset.component = 'counter'
    document.body.append(a, b)

    class Counter extends Component { }
    const instances = initComponent('counter', Counter)

    expect(instances).toHaveLength(2)
    expect(instances[0]).toBeInstanceOf(Counter)
    expect(instances[1]).toBeInstanceOf(Counter)
  })

  it('returns empty array when no matching elements found', () => {
    class Counter extends Component { }
    expect(initComponent('counter', Counter)).toHaveLength(0)
  })

  it('searches within a given context element', () => {
    const ctx = document.createElement('section')
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    inside.dataset.component = 'box'
    outside.dataset.component = 'box'
    ctx.appendChild(inside)
    document.body.append(ctx, outside)

    class Box extends Component { }
    const instances = initComponent('box', Box, ctx)

    expect(instances).toHaveLength(1)
    expect(instances[0]!.element).toBe(inside)
  })
})
