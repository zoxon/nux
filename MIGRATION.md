# Migration Guide: v1.x → v2.0

## Overview

Version 2.0 replaces the centralized component registry with a self-organizing two-phase lifecycle.
The core problem it solves: in v1.x, `init()` ran sequentially, so components initialized earlier
could dispatch events that later components had not yet subscribed to. In v2.0, Phase 1 (`init()`)
completes for **all** components before Phase 2 (`start()`) begins for **any** — broadcasts always
land on registered listeners.

---

## 1. Installation entry point

No changes to the import path.

```ts
import { Component, initComponent, markAppReady } from '@zoxon/nux'
```

---

## 2. Registering and initializing components

### Before

```ts
import { defineComponent, initComponents } from '@zoxon/nux'

defineComponent('counter', Counter)
defineComponent('modal', Modal)

initComponents({ scope: 'page' })
```

### After

```ts
import { initComponent, markAppReady } from '@zoxon/nux'

initComponent('counter', Counter)
initComponent('modal', Modal)

markAppReady()
```

`initComponent` scans `[data-component="name"]` in the DOM immediately and creates instances.
`markAppReady()` signals that all components have been registered and Phase 1 can begin.

#### Limiting scope

Pass a container element as the third argument instead of `{ scope }`:

```ts
const page = document.querySelector<Element>('.page')!
initComponent('counter', Counter, page)
```

---

## 3. Astro integration

### Before

```ts
import nuxIntegration from '@zoxon/nux/astro'
// integration called initComponents() automatically
```

### After

```ts
import nuxIntegration from '@zoxon/nux/astro'
// integration calls markAppReady() on DOMContentLoaded automatically
```

No changes required in `astro.config.*` — the integration API is unchanged.

---

## 4. Vanilla integration

### Before

```ts
import { init } from '@zoxon/nux/vanilla'
init() // called initComponents() internally
```

### After

```ts
import { init } from '@zoxon/nux/vanilla'
init() // calls markAppReady() internally
```

---

## 5. Component class

### Constructor

The constructor no longer accepts `options`. Remove any third argument.

```ts
// before
class Counter extends Component {
  get defaults() {
    return { step: 1 }
  }
}
defineComponent('counter', Counter, { step: 2 })

// after — handle config via data attributes or class fields
class Counter extends Component {
  step = Number(this.element.dataset.step ?? 1)
}
```

### `buildCache()` → inline in `init()`

```ts
// before
class Counter extends Component {
  btn!: HTMLButtonElement
  output!: HTMLElement

  buildCache() {
    this.btn = this.get<HTMLButtonElement>('btn')!
    this.output = this.get<HTMLElement>('output')!
  }
}

// after
class Counter extends Component {
  async init() {
    const btn = this.get<HTMLButtonElement>('btn')
    const output = this.get<HTMLElement>('output')
    // ...
  }
}
```

### `bindEvents()` → `this.on()` inside `init()`

`this.on()` registers the listener **and** schedules automatic removal on `destroy()`. Manual
`removeEventListener` calls are no longer needed.

```ts
// before
class Counter extends Component {
  bindEvents() {
    this.btn?.addEventListener('click', this.handleClick)
  }

  destroy() {
    this.btn?.removeEventListener('click', this.handleClick)
    super.destroy()
  }
}

// after
class Counter extends Component {
  async init() {
    const btn = this.get<HTMLButtonElement>('btn')
    this.on(btn, 'click', () => { /* ... */ })
    // removed automatically on destroy()
  }
}
```

---

## 6. Cross-component events

### Before

Manual `addEventListener` / `removeEventListener` on `window`, or using `@zoxon/eventor` directly.

```ts
import { listenEvent, dispatchCustomEvent } from '@zoxon/eventor'

class Modal extends Component {
  init() {
    listenEvent('modal:open', (e) => this.open(e.detail.id))
  }
}
```

### After

Use `this.on()` and `this.emit()` — the framework handles cleanup and dispatching for you.

```ts
// Augment WindowEventMap once, anywhere in your project
declare global {
  interface WindowEventMap {
    'modal:open': CustomEvent<{ id: string }>
    'modal:close': CustomEvent<null>
  }
}

class Modal extends Component {
  async init() {
    // listen — auto-cleaned on destroy()
    this.on('modal:open', (e) => this.open(e.detail.id))
  }
}

class Trigger extends Component {
  async init() {
    const btn = this.get<HTMLButtonElement>('btn')

    this.onStart(() => {
      // emit in Phase 2 — Modal has already registered its listener
      this.on(btn, 'click', () => this.emit('modal:open', { id: 'main' }))
    })
  }
}
```

---

## 7. Two-phase lifecycle

Use `init()` for Phase 1 (registering listeners) and `start()` for Phase 2 (dispatching events,
starting logic). Or use the single-method style with `this.onStart()`:

```ts
// two-method style
class Counter extends Component {
  #count = 0

  async init() {
    this.on('counter:reset', () => { this.#count = 0 })
  }

  async start() {
    this.emit('counter:ready', { initial: this.#count })
  }
}

// single-method style (Vue 3 setup-like)
class Counter extends Component {
  #count = 0

  async init() {
    this.on('counter:reset', () => { this.#count = 0 })

    this.onStart(() => {
      this.emit('counter:ready', { initial: this.#count })
    })
  }
}
```

---

## 8. Complete before / after example

### Before (v1.x)

```ts
import { Component, defineComponent, initComponents } from '@zoxon/nux'
import { listenEvent, dispatchCustomEvent } from '@zoxon/eventor'

class Counter extends Component {
  plusBtn!: HTMLButtonElement
  output!: HTMLElement
  count = 0

  buildCache() {
    this.plusBtn = this.get<HTMLButtonElement>('plus')!
    this.output = this.get<HTMLElement>('output')!
  }

  bindEvents() {
    this.plusBtn.addEventListener('click', () => {
      this.count++
      this.render()
    })
    listenEvent('counter:reset', () => {
      this.count = 0
      this.render()
    })
  }

  init() {
    this.render()
    dispatchCustomEvent('counter:ready', null)
  }

  render() {
    this.output.textContent = String(this.count)
  }
}

defineComponent('counter', Counter)
initComponents()
```

### After (v2.0)

```ts
import { Component, initComponent, markAppReady } from '@zoxon/nux'

declare global {
  interface WindowEventMap {
    'counter:reset': CustomEvent<null>
    'counter:ready': CustomEvent<null>
  }
}

class Counter extends Component {
  #count = 0

  async init() {
    const plus = this.get<HTMLButtonElement>('plus')
    const output = this.get<HTMLElement>('output')

    this.on(plus, 'click', () => {
      this.#count++
      output!.textContent = String(this.#count)
    })

    this.on('counter:reset', () => {
      this.#count = 0
      output!.textContent = '0'
    })

    this.onStart(() => {
      this.emit('counter:ready', null)
    })
  }
}

initComponent('counter', Counter)
markAppReady()
```

---

## 9. Removed API surface

| v1.x | v2.0 replacement |
|------|-----------------|
| `defineComponent(name, Class)` | `initComponent(name, Class)` |
| `registerComponent(name, Class)` | `initComponent(name, Class)` |
| `initComponents({ scope })` | `markAppReady()` |
| `getInstance(name)` | `component.getInstance(element)` |
| `buildCache()` | inline in `init()` |
| `bindEvents()` | `this.on()` inside `init()` |
| `this.options` | `this.element.dataset.*` or class fields |
| `get defaults()` | class field initializers |
| `ComponentsMap` | — |
| `ComponentOptions` | — |
| `Reference` | — |
| `Dependency` | — |
| `ComponentInstance` | — |
| `Options` | — |
