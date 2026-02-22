import type { Component } from './Component'
import type { ComponentRootElement } from './types'
import { dispatchCustomEvent, listenEvent } from './events'

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

export function onEvent(
  eventOrElement: string | Element | null,
  handlerOrEvent: ((e: Event) => void) | string,
  handler?: (e: Event) => void
): (() => void) | undefined {
  if (typeof eventOrElement === 'string') {
    return listenEvent(eventOrElement as keyof WindowEventMap, handlerOrEvent as EventListener)
  } else if (eventOrElement && typeof handlerOrEvent === 'string' && handler) {
    const h = handler as EventListener
    eventOrElement.addEventListener(handlerOrEvent, h)
    return () => eventOrElement.removeEventListener(handlerOrEvent, h)
  }
  return undefined
}

export function emitEvent(
  eventOrElement: string | Element | null,
  detailOrEvent: unknown,
  detail?: unknown
): void {
  if (typeof eventOrElement === 'string') {
    dispatchCustomEvent(eventOrElement as keyof WindowEventMap, detailOrEvent as never)
  } else if (eventOrElement) {
    eventOrElement.dispatchEvent(new CustomEvent(detailOrEvent as string, { detail, bubbles: true, composed: true }))
  }
}
