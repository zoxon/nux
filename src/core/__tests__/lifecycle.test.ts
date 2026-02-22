import { beforeEach, describe, expect, it, vi } from 'vitest'

// lifecycle has module-level state — reset modules before each test
// so every test starts with isAppReady=false, isSetupComplete=false, setupCounter=0

type LifecycleModule = typeof import('../lifecycle')

describe('lifecycle', () => {
  let m: LifecycleModule

  beforeEach(async () => {
    vi.resetModules()
    m = await import('../lifecycle')
  })

  describe('onAppReady', () => {
    it('defers callback until markAppReady is called', () => {
      let called = false
      m.onAppReady(() => { called = true })
      expect(called).toBe(false)
      m.markAppReady()
      expect(called).toBe(true)
    })

    it('fires callback immediately if app is already ready', () => {
      m.markAppReady()
      let called = false
      m.onAppReady(() => { called = true })
      expect(called).toBe(true)
    })

    it('fires each callback only once per markAppReady call', () => {
      let count = 0
      m.onAppReady(() => { count++ })
      m.markAppReady()
      m.markAppReady() // idempotent
      expect(count).toBe(1)
    })
  })

  describe('markAppReady', () => {
    it('is idempotent', () => {
      let count = 0
      m.onAppReady(() => { count++ })
      m.markAppReady()
      m.markAppReady()
      expect(count).toBe(1)
    })

    it('triggers setup-complete immediately when no components are pending', () => {
      let done = false
      m.onSetupComplete(() => { done = true })
      expect(done).toBe(false)
      m.markAppReady()
      expect(done).toBe(true)
    })
  })

  describe('registerComponentSetup / unregisterComponentSetup', () => {
    it('delays setup-complete while a component is pending', () => {
      let done = false
      m.onSetupComplete(() => { done = true })

      m.registerComponentSetup()
      m.markAppReady()
      expect(done).toBe(false)

      m.unregisterComponentSetup()
      expect(done).toBe(true)
    })

    it('waits for all pending setups before triggering setup-complete', () => {
      let done = false
      m.onSetupComplete(() => { done = true })

      m.registerComponentSetup()
      m.registerComponentSetup()
      m.markAppReady()

      m.unregisterComponentSetup()
      expect(done).toBe(false) // still one pending

      m.unregisterComponentSetup()
      expect(done).toBe(true)
    })

    it('does not trigger setup-complete before markAppReady even if counter reaches zero', () => {
      let done = false
      m.onSetupComplete(() => { done = true })

      m.registerComponentSetup()
      m.unregisterComponentSetup()
      expect(done).toBe(false) // app not ready yet

      m.markAppReady()
      expect(done).toBe(true)
    })
  })

  describe('onSetupComplete', () => {
    it('fires immediately if setup is already complete', () => {
      m.markAppReady()
      let called = false
      m.onSetupComplete(() => { called = true })
      expect(called).toBe(true)
    })

    it('defers callback until all components complete setup', () => {
      m.registerComponentSetup()
      let called = false
      m.onSetupComplete(() => { called = true })

      m.markAppReady()
      expect(called).toBe(false)

      m.unregisterComponentSetup()
      expect(called).toBe(true)
    })

    it('fires each callback only once', () => {
      let count = 0
      m.onSetupComplete(() => { count++ })
      m.markAppReady()
      m.markAppReady()
      expect(count).toBe(1)
    })
  })
})
