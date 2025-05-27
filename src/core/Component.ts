import type { ComponentOptions } from './types'

/**
 * Javascript component core class
 * @usage
 * class MyComponent extends Component {
 *  init() {
 *    console.log('Hello world')
 *  }
 * }
 */
export abstract class Component<D = Record<string, any>> {
  name: string
  element: HTMLElement

  options: Record<string, any>
  rawRefs: { name: string; element: HTMLElement }[] = []
  data: D

  constructor({ name, element, references = [], options = {}, data = {} as D }: ComponentOptions<D>) {
    this.name = name
    this.element = element
    this.options = options
    this.rawRefs = references
    this.data = data

    this.buildCache()
    this.bindEvents()
    if (import.meta.env.DEV) {
      /* eslint-disable no-console */
      console.groupCollapsed('ℹ️ Component initialized: %s', this.name)
      console.log('Element:', this.element)
      console.log('Options:', this.options)
      console.log('References:', this.rawRefs)
      console.groupEnd()
      /* eslint-enable no-console */
    }

    (this.element as any).__instance = this
  }

  init(): Promise<void> | void { }
  buildCache(): Promise<void> | void { }
  bindEvents(): Promise<void> | void { }

  destroy(): void {
    ; (this.element as any).__instance = undefined
  }

  get<T extends HTMLElement = HTMLElement>(name: string): T | undefined {
    const reference = this.rawRefs.find((reference) => reference.name.toLowerCase() === `${this.name}:${name}`.toLowerCase())

    if (!reference) {
      return
    }

    return reference.element as T
  }

  getAll<T extends HTMLElement = HTMLElement>(name: string) {
    return this.rawRefs
      .filter((reference) => reference.name === `${this.name}:${name}`)
      .map((reference) => reference.element as T)
  }
}
