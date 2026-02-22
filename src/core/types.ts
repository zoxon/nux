import type { Component } from './Component'

export interface ComponentRootElement<T extends Component> extends HTMLElement {
  __instance?: T
}

