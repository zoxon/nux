import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Custom events used in these tests
declare global {
  interface WindowEventMap {
    'test:signal': CustomEvent<{ value: number }>
    'test:broadcast': CustomEvent<null>
  }
}

// Flush all microtasks + one macrotask so async lifecycle completes
const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve))

type ComponentClass = typeof import('../Component').Component
type MarkAppReady = () => void

describe('Component', () => {
  let Component: ComponentClass
  let markAppReady: MarkAppReady

  beforeEach(async () => {
    vi.resetModules()
    const [compMod, lifecycleMod] = await Promise.all([
      import('../Component'),
      import('../lifecycle'),
    ])
    Component = compMod.Component
    markAppReady = lifecycleMod.markAppReady
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function makeEl() {
    const el = document.createElement('div')
    document.body.appendChild(el)
    return el
  }

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('stores the element reference', () => {
      const el = makeEl()
      class Foo extends Component { }
      expect(new Foo('foo', el).element).toBe(el)
    })

    it('sets data-{name}-inited attribute on the element', () => {
      const el = makeEl()
      class Foo extends Component { }
      new Foo('foo', el)
      expect(el.getAttribute('data-foo-inited')).toBe('true')
    })

    it('skips re-initialization if element already has init attribute', async () => {
      const el = makeEl()
      let count = 0
      class Foo extends Component {
        override async init() { count++ }
      }
      new Foo('foo', el)
      new Foo('foo', el) // second call — already has data-foo-inited
      markAppReady()
      await flushPromises()
      expect(count).toBe(1)
    })
  })

  // ─── Two-phase lifecycle ────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls init() then start() in order', async () => {
      const log: string[] = []
      class Foo extends Component {
        override async init() { log.push('init') }
        override async start() { log.push('start') }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()
      expect(log).toEqual(['init', 'start'])
    })

    it('all init() complete before any start() runs', async () => {
      const log: string[] = []
      class A extends Component {
        override async init() { log.push('A:init') }
        override async start() { log.push('A:start') }
      }
      class B extends Component {
        override async init() { log.push('B:init') }
        override async start() { log.push('B:start') }
      }
      new A('a', makeEl())
      new B('b', makeEl())
      markAppReady()
      await flushPromises()

      const lastInit = Math.max(log.indexOf('A:init'), log.indexOf('B:init'))
      const firstStart = Math.min(log.indexOf('A:start'), log.indexOf('B:start'))
      expect(lastInit).toBeLessThan(firstStart)
    })

    it('onStart() callback runs after start()', async () => {
      const log: string[] = []
      class Foo extends Component {
        override async init() {
          this.onStart(() => { log.push('onStart') })
        }
        override async start() { log.push('start') }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()
      expect(log).toEqual(['start', 'onStart'])
    })

    it('onStart() allows writing both phases in init()', async () => {
      const log: string[] = []
      class Foo extends Component {
        override async init() {
          log.push('init')
          this.onStart(() => { log.push('phase2') })
        }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()
      expect(log).toEqual(['init', 'phase2'])
    })
  })

  // ─── on() — window events ──────────────────────────────────────────────────

  describe('on() — window events', () => {
    it('registers listener and receives events', async () => {
      const handler = vi.fn()
      class Foo extends Component {
        override async init() { this.on('test:signal', handler) }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()

      window.dispatchEvent(new CustomEvent('test:signal', { detail: { value: 1 } }))
      expect(handler).toHaveBeenCalledOnce()
    })

    it('removes window listener on destroy()', async () => {
      const handler = vi.fn()
      class Foo extends Component {
        override async init() { this.on('test:signal', handler) }
      }
      const foo = new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()

      foo.destroy()
      window.dispatchEvent(new CustomEvent('test:signal', { detail: { value: 1 } }))
      expect(handler).not.toHaveBeenCalled()
    })
  })

  // ─── on() — DOM element events ─────────────────────────────────────────────

  describe('on() — DOM element events', () => {
    it('registers listener on DOM element', async () => {
      const handler = vi.fn()
      class Foo extends Component {
        override async init() { this.on(this.element, 'click', handler) }
      }
      const el = makeEl()
      new Foo('foo', el)
      markAppReady()
      await flushPromises()

      el.dispatchEvent(new MouseEvent('click'))
      expect(handler).toHaveBeenCalledOnce()
    })

    it('removes DOM listener on destroy()', async () => {
      const handler = vi.fn()
      class Foo extends Component {
        override async init() { this.on(this.element, 'click', handler) }
      }
      const el = makeEl()
      const foo = new Foo('foo', el)
      markAppReady()
      await flushPromises()

      foo.destroy()
      el.dispatchEvent(new MouseEvent('click'))
      expect(handler).not.toHaveBeenCalled()
    })

    it('silently skips null element', async () => {
      class Foo extends Component {
        override async init() {
          expect(() => this.on(null, 'click', vi.fn())).not.toThrow()
        }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()
    })
  })

  // ─── emit() ────────────────────────────────────────────────────────────────

  describe('emit()', () => {
    it('broadcasts a window custom event', async () => {
      const handler = vi.fn()
      window.addEventListener('test:broadcast', handler)

      class Foo extends Component {
        override async start() { this.emit('test:broadcast', null) }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()

      expect(handler).toHaveBeenCalledOnce()
      window.removeEventListener('test:broadcast', handler)
    })

    it('dispatches event on a DOM element', async () => {
      const handler = vi.fn()
      class Foo extends Component {
        override async start() {
          this.element.addEventListener('custom:test', handler)
          this.emit(this.element, 'custom:test', { ok: true })
        }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()

      expect(handler).toHaveBeenCalledOnce()
    })

    it('silently skips null element', async () => {
      class Foo extends Component {
        override async start() {
          expect(() => this.emit(null, 'custom:test')).not.toThrow()
        }
      }
      new Foo('foo', makeEl())
      markAppReady()
      await flushPromises()
    })
  })

  // ─── DOM query methods ─────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns element by data-ref', () => {
      const root = makeEl()
      const child = document.createElement('span')
      child.dataset.ref = 'foo:title'
      root.appendChild(child)

      class Foo extends Component { }
      expect(new Foo('foo', root).get('title')).toBe(child)
    })

    it('returns null if not found', () => {
      class Foo extends Component { }
      expect(new Foo('foo', makeEl()).get('missing')).toBeNull()
    })

    it('searches within a given context element', () => {
      const root = makeEl()
      const ctx = document.createElement('section')
      const child = document.createElement('span')
      child.dataset.ref = 'foo:btn'
      ctx.appendChild(child)
      root.appendChild(ctx)

      class Foo extends Component { }
      expect(new Foo('foo', root).get('btn', ctx)).toBe(child)
    })
  })

  describe('getAll()', () => {
    it('returns all matching elements', () => {
      const root = makeEl()
      const a = document.createElement('span')
      const b = document.createElement('span')
      a.dataset.ref = 'foo:item'
      b.dataset.ref = 'foo:item'
      root.append(a, b)

      class Foo extends Component { }
      expect(new Foo('foo', root).getAll('item')).toEqual([a, b])
    })

    it('returns empty array if none found', () => {
      class Foo extends Component { }
      expect(new Foo('foo', makeEl()).getAll('item')).toEqual([])
    })
  })

  describe('getParent()', () => {
    it('returns closest ancestor matching data-ref', () => {
      const root = makeEl()
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.dataset.ref = 'foo:row'
      parent.appendChild(child)
      root.appendChild(parent)

      class Foo extends Component { }
      expect(new Foo('foo', root).getParent(child, 'row')).toBe(parent)
    })

    it('returns null if no matching ancestor', () => {
      const root = makeEl()
      const child = document.createElement('span')
      root.appendChild(child)

      class Foo extends Component { }
      expect(new Foo('foo', root).getParent(child, 'row')).toBeNull()
    })
  })

  // ─── destroy() ─────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('removes __instance from element', () => {
      const el = makeEl()
      class Foo extends Component { }
      const foo = new Foo('foo', el)

      foo.destroy()

      expect((el as unknown as Record<string, unknown>)['__instance']).toBeUndefined()
    })

    it('removes all registered listeners', async () => {
      const winHandler = vi.fn()
      const domHandler = vi.fn()

      class Foo extends Component {
        override async init() {
          this.on('test:signal', winHandler)
          this.on(this.element, 'click', domHandler)
        }
      }
      const el = makeEl()
      const foo = new Foo('foo', el)
      markAppReady()
      await flushPromises()

      foo.destroy()

      window.dispatchEvent(new CustomEvent('test:signal', { detail: { value: 0 } }))
      el.dispatchEvent(new MouseEvent('click'))

      expect(winHandler).not.toHaveBeenCalled()
      expect(domHandler).not.toHaveBeenCalled()
    })
  })
})
