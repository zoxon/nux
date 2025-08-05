import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildComponentReferenceMap,
  registerComponent,
  defineComponent,
  initComponents,
  getInstance,
  componentsRegistry
} from './helpers'
import { Component } from './Component'
import type { ComponentInstance } from './types'

class TestComponent extends Component {
  override init = vi.fn()
}

describe('core/helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    componentsRegistry.clear()
  })

  it('builds component map with refs and dependencies', () => {
    document.body.innerHTML = `
      <div data-component="Root">
        <div data-ref="button"></div>
        <div data-component="Nested"></div>
      </div>
    `

    const map = buildComponentReferenceMap()

    expect(map.length).toBe(2)

    const root = map.find((c) => c.name === 'Root')!
    expect(root.refs).toHaveLength(1)
    expect(root.refs[0].name).toBe('button')
    expect(root.dependencies).toHaveLength(1)
    expect(root.dependencies[0].name).toBe('Nested')

    const nested = map.find((c) => c.name === 'Nested')!
    expect(nested.refs).toHaveLength(0)
    expect(nested.dependencies).toHaveLength(0)
  })

  it('registers and retrieves component from registry', () => {
    const component = {} as ComponentInstance
    registerComponent('Foo', component)
    expect(componentsRegistry.get('Foo')).toBe(component)
  })

  it('defineComponent is alias for registerComponent', () => {
    const component = {} as ComponentInstance
    defineComponent('Bar', component)
    expect(componentsRegistry.get('Bar')).toBe(component)
  })

  it('initializes registered components with correct options', async () => {
    document.body.innerHTML = `
      <div data-component="Test">
        <span data-ref="ok"></span>
      </div>
    `

    defineComponent('Test', TestComponent)

    const map = await initComponents()

    expect(map).toHaveLength(1)
    const compData = map[0]
    expect(compData.name).toBe('Test')
    expect(compData.refs).toHaveLength(1)
    expect(compData.instance).toBeInstanceOf(TestComponent)
    expect((compData.instance as TestComponent).init).toHaveBeenCalled()
  })

  it('getInstance returns instance by element', async () => {
    document.body.innerHTML = `
      <div data-component="Test"></div>
    `
    defineComponent('Test', TestComponent)
    const map = await initComponents()

    const el = document.querySelector('[data-component="Test"]')!
    const instance = getInstance(el)

    expect(instance).toBe(map[0].instance)
  })

  it('skips unknown components in initComponents', async () => {
    document.body.innerHTML = `<div data-component="Unregistered"></div>`
    const map = await initComponents()
    expect(map[0].instance).toBeUndefined()
  })

  it('gracefully handles invalid selector in getScopeElement', async () => {
    document.body.innerHTML = `<div data-component="X"></div>`
    defineComponent('X', TestComponent)
    const map = await initComponents({ scope: '.non-existent' })
    expect(map[0].name).toBe('X')
  })
})
