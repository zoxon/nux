import type { Component } from './Component'

export interface Reference {
  name: string
  element: HTMLElement
}

export interface Dependency {
  name: string
  rootElement: Element
}

export interface ComponentOptions<D = Record<string, any>> {
  name: string
  element: HTMLElement
  references?: Reference[]

  options?: Record<string, any>
  data?: D
}

export type ComponentsMap = {
  name: string
  rootElement: HTMLElement
  dependencies?: Dependency[]
  refs: Reference[]
  instance?: Component
}[]

export interface ComponentInstance {
  new(options: ComponentOptions): Component
}
