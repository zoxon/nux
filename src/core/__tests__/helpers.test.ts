import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── createInstance ───────────────────────────────────────────────────────────

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
