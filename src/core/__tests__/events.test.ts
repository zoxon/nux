import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchCustomEvent, dispatchElement, EventController, listenElement, listenEvent } from '../events'

// ─── listenEvent ──────────────────────────────────────────────────────────────

describe('listenEvent', () => {
  it('registers window event listener and returns cleanup', () => {
    const handler = vi.fn()
    const cleanup = listenEvent('component:inited', handler)

    expect(typeof cleanup).toBe('function')
    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce()

    cleanup()
    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })
})

// ─── dispatchCustomEvent ──────────────────────────────────────────────────────

describe('dispatchCustomEvent', () => {
  it('dispatches a window custom event', () => {
    const handler = vi.fn()
    window.addEventListener('component:inited', handler)

    dispatchCustomEvent('component:inited', 'test-component')

    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('component:inited', handler)
  })
})

// ─── listenElement ────────────────────────────────────────────────────────────

describe('listenElement', () => {
  it('registers DOM element listener and returns cleanup', () => {
    const el = document.createElement('button')
    const handler = vi.fn()
    const cleanup = listenElement(el, 'click', handler)

    expect(typeof cleanup).toBe('function')
    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce()

    cleanup?.()
    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })

  it('returns undefined for null element', () => {
    const cleanup = listenElement(null, 'click', vi.fn())
    expect(cleanup).toBeUndefined()
  })
})

// ─── dispatchElement ──────────────────────────────────────────────────────────

describe('dispatchElement', () => {
  it('dispatches a custom event on an element', () => {
    const el = document.createElement('div')
    const handler = vi.fn()
    el.addEventListener('custom:event', handler)

    dispatchElement(el, 'custom:event', { payload: 42 })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('dispatches element events with bubbles and composed', () => {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)
    document.body.appendChild(parent)

    const handler = vi.fn()
    parent.addEventListener('custom:bubble', handler)

    dispatchElement(child, 'custom:bubble', null)
    expect(handler).toHaveBeenCalledOnce()

    document.body.removeChild(parent)
  })

  it('skips silently for null element', () => {
    expect(() => dispatchElement(null, 'custom:event')).not.toThrow()
  })
})

// ─── EventController ──────────────────────────────────────────────────────────

describe('EventController', () => {
  it('registers window listener via on() and removes it on destroy()', () => {
    const handler = vi.fn()
    const ctrl = new EventController()
    ctrl.on('component:inited', handler)

    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce()

    ctrl.destroy()
    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })

  it('registers DOM listener via listen() and removes it on destroy()', () => {
    const el = document.createElement('button')
    const handler = vi.fn()
    const ctrl = new EventController()
    ctrl.listen(el, 'click', handler)

    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce()

    ctrl.destroy()
    el.dispatchEvent(new MouseEvent('click'))
    expect(handler).toHaveBeenCalledOnce() // still once — listener removed
  })

  it('silently skips null element in listen()', () => {
    const ctrl = new EventController()
    expect(() => ctrl.listen(null, 'click', vi.fn())).not.toThrow()
    ctrl.destroy()
  })

  it('removes multiple listeners at once on destroy()', () => {
    const winHandler = vi.fn()
    const domHandler = vi.fn()
    const el = document.createElement('div')
    const ctrl = new EventController()

    ctrl.on('component:inited', winHandler)
    ctrl.listen(el, 'click', domHandler)
    ctrl.destroy()

    window.dispatchEvent(new CustomEvent('component:inited', { detail: 'test' }))
    el.dispatchEvent(new MouseEvent('click'))

    expect(winHandler).not.toHaveBeenCalled()
    expect(domHandler).not.toHaveBeenCalled()
  })
})

afterEach(() => {
  document.body.innerHTML = ''
})
