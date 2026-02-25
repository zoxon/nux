import type { Component } from './Component'
import type { ComponentRootElement } from './types'

export function getInstanceFromElement<T extends Component>(element: ComponentRootElement<T>): T | undefined {
  return element.__instance
}

export function createInstance<T extends typeof Component>(
  element: HTMLElement,
  name: string,
  ComponentClass: T
): InstanceType<T> {
  const existing = getInstanceFromElement<InstanceType<T>>(element as ComponentRootElement<InstanceType<T>>)
  if (existing) return existing

  const instance = new ComponentClass(name, element) as InstanceType<T>
  ;(element as ComponentRootElement<InstanceType<T>>).__instance = instance
  return instance
}

export function initComponent<T extends typeof Component>(
  name: string,
  ComponentClass: T,
  context: Element = document.documentElement
): InstanceType<T>[] {
  const elements = context.querySelectorAll<ComponentRootElement<InstanceType<T>>>(`[data-component="${name}"]`)
  return [...elements].map((element) => createInstance(element, name, ComponentClass))
}
