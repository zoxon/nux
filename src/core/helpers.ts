import type { ComponentInstance, ComponentsMap } from './types'

export const componentsRegistry = new Map<string, ComponentInstance>()
let componentsMap: ComponentsMap = []

/**
 * Build a map of components and their references
 * @param scope The scope where to search for components
 * @default document
 *
 * @returns The map of components and their references
 */
export function buildComponentReferenceMap(scope: Element | Document = document): ComponentsMap {
  const referenceElements = scope.querySelectorAll<HTMLElement>('[data-ref]')
  const componentsMap: ComponentsMap = []

  for (const referenceElement of referenceElements) {
    const componentElement = referenceElement.closest<HTMLElement>('[data-component]')
    if (!componentElement) {
      continue
    }

    let component = componentsMap.find((component) => component.rootElement === componentElement)

    const componentName = componentElement.dataset.component
    if (!componentName) {
      continue
    }

    if (!component) {
      component = {
        name: componentName,
        rootElement: componentElement,
        refs: [],
        dependencies: [],
      }

      componentsMap.push(component)
    }

    // Find and add dependencies
    const dependencyElements = componentElement.querySelectorAll<HTMLElement>('[data-component]')

    for (const dependencyElement of dependencyElements) {
      const dependencyName = dependencyElement.dataset.component
      if (dependencyName && dependencyName !== componentName) {
        component.dependencies!.push({
          name: dependencyName,
          rootElement: dependencyElement,
        })
      }
    }

    // Find and add references
    const referenceName = referenceElement.dataset.ref
    if (!referenceName) {
      continue
    }

    component.refs.push({
      name: referenceName,
      element: referenceElement,
    })
  }

  // Find and add components without references
  const componentElements = scope.querySelectorAll<HTMLElement>('[data-component]')
  for (const componentElement of componentElements) {
    if (!componentsMap.some((component) => component.rootElement === componentElement)) {
      const componentName = componentElement.dataset.component
      if (!componentName) {
        continue
      }

      componentsMap.push({
        name: componentName,
        rootElement: componentElement,
        refs: [],
        dependencies: [],
      })
    }
  }

  return componentsMap
}

/**
 * Register a component
 * @param name The name of the component
 * @param component The component
 */
export function registerComponent(name: string, component: ComponentInstance) {
  componentsRegistry.set(name, component)
}

export function defineComponent(name: string, component: ComponentInstance) {
  registerComponent(name, component)
}

export type ScopeSelector = string | 'page'

const getScopeElement = (selector?: ScopeSelector) => {
  if (!selector || selector === 'page') {
    return document
  }

  const element = document.querySelector(selector)
  if (!element) {
    return document
  }

  return element
}

export type InitializeOptions = {
  scope?: ScopeSelector
}

/**
 * Initialize components
 * @param scope The scope where to search for components
 * @default document
 */
export async function initComponents(options = { scope: 'page' }): Promise<ComponentsMap> {
  const scope = getScopeElement(options.scope)
  componentsMap = buildComponentReferenceMap(scope)

  for (const componentData of componentsMap) {
    const RegisteredComponent = componentsRegistry.get(componentData.name)

    if (RegisteredComponent) {
      const componentInstance = new RegisteredComponent({
        name: componentData.name,
        element: componentData.rootElement,
        references: componentData.refs,
      })

      componentData.instance = componentInstance

      await componentInstance.init()
    }
  }

  return componentsMap
}

export function getInstance(element: Element) {
  const component = componentsMap.find((component) => component.rootElement === element)
  return component?.instance
}
