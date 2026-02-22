# ![Nux Logo](./logo.svg)

Nux — tiny core. total control.

## TL;DR

Nux is a TypeScript-first micro-framework for DOM components with a two-phase lifecycle.

- Build isolated components with typed lifecycle and scoped DOM refs.
- Automatic listener cleanup — no manual `removeEventListener`.
- Works with Astro, static HTML, or any SSR stack.

> **Upgrading from v1.x?** See the [Migration Guide](./MIGRATION.md).

## Why "Nux"?

The name **Nux** combines several meaningful layers:

- **Nux as new UX** — a modern, flexible experience layer for web applications.
- **Nux as nucleus** — minimalistic and foundational architecture.
- **Nux as nut** — small, compact, yet powerful.

## Features

- **Zero dependencies** — lightweight core, no external runtime packages.
- **Fully typed API** — built entirely with TypeScript, Intellisense included.
- **Two-phase lifecycle** — all listeners register before any start logic runs, eliminating broadcast event race conditions.
- **Automatic cleanup** — `this.on()` listeners are removed automatically on `destroy()`.
- **Vue 3-style setup** — write both phases in one method with `this.onStart()`.
- **Framework-agnostic** — works with Astro, SSR, or plain HTML.
- **Tiny footprint** — under 1 KB minified and gzipped.

## Getting Started

1. **Install**

   ```bash
   npm install @zoxon/nux
   ```

2. **Define a component**

   ```ts
   import { Component } from '@zoxon/nux'

   class Counter extends Component {
     #count = 0

     async init() {
       const btn = this.get<HTMLButtonElement>('btn')
       const output = this.get<HTMLElement>('output')

       this.on(btn, 'click', () => {
         this.#count++
         output!.textContent = String(this.#count)
       })
     }
   }
   ```

3. **HTML markup**

   ```html
   <div data-component="counter">
     <button data-ref="counter:btn">+</button>
     <span data-ref="counter:output">0</span>
   </div>
   ```

4. **Initialize**

   ```ts
   import { initComponent, markAppReady } from '@zoxon/nux'

   initComponent('counter', Counter)
   markAppReady()
   ```

## Two-Phase Lifecycle

Components initialize in two phases to prevent broadcast event race conditions:

| Phase | Method     | Purpose                            |
|-------|------------|------------------------------------|
| 1     | `init()`   | Register listeners, prepare state  |
| 2     | `start()`  | Dispatch events, start logic       |

Phase 1 completes for **all** components before Phase 2 begins for **any**. A component that
dispatches an event in `start()` is guaranteed that every other component has already registered
its listeners in `init()`.

```ts
class Modal extends Component {
  async init() {
    // Phase 1 — safe to register listeners
    this.on('modal:open', (e) => this.open(e.detail.id))
  }
}

class Trigger extends Component {
  async start() {
    // Phase 2 — Modal's listener is already registered
    this.emit('modal:open', { id: 'main' })
  }
}
```

## API Reference

### Lifecycle methods

```ts
class MyComponent extends Component {
  async init(): Promise<void>
  // Phase 1. Register listeners via this.on(). Called before any start().

  async start(): Promise<void>
  // Phase 2. Dispatch events, start logic. Called after all init() complete.

  destroy(): void
  // Remove all listeners and detach from the DOM element.
}
```

### `this.on()` — listen to events

Listeners registered with `this.on()` are removed automatically when `destroy()` is called.

```ts
// Window custom event
this.on('modal:open', (e) => { /* e.detail is typed */ })

// DOM element event (null-safe — skipped silently if element is null)
this.on(this.get('btn'), 'click', (e) => { /* ... */ })
```

### `this.emit()` — dispatch events

```ts
// Broadcast on window
this.emit('counter:updated', { value: 42 })

// Dispatch on a DOM element (bubbles: true, composed: true)
this.emit(this.get('btn'), 'custom:event', { payload: 42 })
```

### `this.onStart()` — Vue 3 setup style

Schedule Phase 2 code from within `init()`, keeping both phases in a single method.

```ts
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

### DOM query methods

```ts
// Single element by data-ref="componentName:refName"
this.get<HTMLButtonElement>('btn')        // → HTMLButtonElement | null

// All matching elements
this.getAll<HTMLElement>('item')          // → HTMLElement[]

// Closest ancestor by data-ref
this.getParent<HTMLElement>(child, 'row') // → HTMLElement | null
```

**HTML:**

```html
<div data-component="counter">
  <button data-ref="counter:btn">+</button>
  <ul>
    <li data-ref="counter:item">one</li>
    <li data-ref="counter:item">two</li>
  </ul>
</div>
```

### `this.getInstance()` — access another component's instance

```ts
const el = this.get<ComponentRootElement<Modal>>('trigger')
const modal = this.getInstance(el)  // → Modal | undefined
```

### Component properties

| Property  | Type          | Description           |
|-----------|---------------|-----------------------|
| `element` | `HTMLElement` | The root DOM element. |

## Typed Cross-Component Events

Augment `WindowEventMap` once to get full type safety in `this.on()` and `this.emit()`:

```ts
// events.d.ts (or any .ts file in your project)
declare global {
  interface WindowEventMap {
    'modal:open':  CustomEvent<{ id: string }>
    'modal:close': CustomEvent<null>
  }
}
```

```ts
class Modal extends Component {
  async init() {
    this.on('modal:open', (e) => this.open(e.detail.id))  // e.detail: { id: string }
    this.on('modal:close', () => this.close())
  }
}

class Trigger extends Component {
  async init() {
    this.onStart(() => {
      this.emit('modal:open', { id: 'main' })  // type-checked
    })
  }
}
```

## Full Example

```html
<div data-component="counter">
  <div data-ref="counter:result">0</div>
  <button type="button" data-ref="counter:plus">+</button>
  <button type="button" data-ref="counter:minus">−</button>
</div>
```

```ts
import { Component, initComponent, markAppReady } from '@zoxon/nux'

declare global {
  interface WindowEventMap {
    'counter:updated': CustomEvent<{ value: number }>
  }
}

class Counter extends Component {
  #count = 0

  async init() {
    const plus   = this.get<HTMLButtonElement>('plus')
    const minus  = this.get<HTMLButtonElement>('minus')
    const result = this.get<HTMLElement>('result')

    this.on(plus,  'click', () => { this.#count++; this.#render(result) })
    this.on(minus, 'click', () => { this.#count--; this.#render(result) })

    this.onStart(() => {
      this.emit('counter:updated', { value: this.#count })
    })
  }

  #render(output: HTMLElement | null) {
    if (output) output.textContent = String(this.#count)
  }
}

initComponent('counter', Counter)
markAppReady()
```

## Integrations

### Astro

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config'
import nux from '@zoxon/nux/astro'

export default defineConfig({
  integrations: [nux()],
})
```

The integration injects a script that calls `markAppReady()` on `DOMContentLoaded` automatically.

### Vanilla HTML

```ts
import { init } from '@zoxon/nux/vanilla'
init()
```

## Contributing

We welcome PRs, issues, and ideas! Open a discussion or submit a patch — let's build a better component model together.

## License

MIT © [Konstantin Velichko](https://github.com/zoxon)
