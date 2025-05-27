# ![Nux Logo](./logo.svg)

Nux — tiny core. total control.

## 📷 TL;DR

Nux is a zero-dependency, TypeScript-first micro-framework for DOM components.

- ✅ Build isolated components with lifecycle and refs.
- ♻️ Destroy components with a single line.
- 💡 Use in Astro, static HTML, or any SSR stack.


## 📛 Why "Nux"?

The name **Nux** combines several meaningful layers that reflect the core qualities of the framework:

- **Nux as new UX** — emphasizing the creation of a modern, flexible, and enhanced user experience layer for web applications.
- **Nux as nucleus** — symbolizes the core, the origin from which everything else is born. Minimalistic and foundational architecture that kickstarts UI development.
- **Nux as nut** — small, compact, yet incredibly powerful. A framework with enormous potential packed into a tiny size.

Thus, **Nux** is a lightweight, basic, yet powerful and extensible tool that energizes and structures your frontend components.

## 🌟 What is Nux?

- ⚡️ Zero Dependencies – Lightweight core, no external runtime packages.
- 🧠 Fully Typed API – Built entirely with TypeScript. Intellisense included.
- 🧩 Component-Based Architecture – Isolated logic with lifecycle, actions, and state.
- 🎯 Direct DOM Control – Fine-grained event binding with scoped data-refs and native API.
- 🔥 Scoped Event System – Nux leverages the native browser EventTarget API (no polyfills, full performance).
- ♻️ Clean Destroy Logic – One-liner teardown of listeners, timeouts, or observers.
- 🛠 Framework-Agnostic – Works with Astro, SSR, or plain HTML.
- 🚀 Zero Runtime Overhead – No hydration or reactivity overhead unless you need it.
- 📦 Tiny Footprint – Under 1KB when minified and gzipped.


## 🚀 Getting Started

1. Install

   ```bash
   npm install @zoxon/nux
   ```

2. Import the library in your JavaScript or TypeScript file:

   ```javascript
   import { Component, defineComponent } from '@zoxon/nux'
   ```

3. Create a component by extending the `Component` class:

   ```javascript
    import { Component } from '@zoxon/nux'

    class Counter extends Component {
      count = 0

      init() {
        this.get('increment')?.addEventListener('click', () => {
          this.count++
          this.get('output')!.textContent = String(this.count)
        })
      }
    }
   ```

4. HTML Markup

   ```html
   <div data-component="counter">
     <button data-ref="increment">Increment</button>
     <span data-ref="output">0</span>
   </div>
   ```

5. Register and Initialize

    ```javascript
    import { defineComponent, initComponents } from '@zoxon/nux'

    defineComponent('counter', Counter)
    initComponents({ scope: 'page' })
    ```

## 🛠 API Reference

Every component extends the Component base class, giving you lifecycle methods and utilities to interact with the DOM and other components in a clean, consistent way.

### Lifecycle Methods

- `init()`: Called automatically when the component is initialized.
- `buildCache()`:	Called during construction to process refs and perform pre-binding setup.
- `bindEvents()`:	Bind all DOM and custom events here. Called after buildCache().
- `destroy()`:	Optional cleanup method called when the component is destroyed.

```typescript
export class MyComponent extends Component {
  async init() {
    console.log('Component is live!')
  }

  buildCache() {
    this.title = this.get('title')
  }

  bindEvents() {
    this.title?.addEventListener('click', () => alert('Clicked!'))
  }

  destroy() {
    console.log('Component removed')
  }
}
```

### Utility Methods

`get(name: string): HTMLElement | undefined` - Returns a single element by `data-ref`. Should be prefixed with component name in markup.
If multiple components may be on the page, prefix `data-ref` with the component name (e.g., `data-ref="modal:title"`). Otherwise, plain `data-ref="title"` is fine.

```html
<div data-ref="modal:title">Hello</div>
```

```typescript
const title = this.get('title')
```

`getAll(name: string): HTMLElement[]` - Returns an array of elements by `data-ref`. Should be prefixed with component name in markup.

```html
<div data-ref="modal:button">Button 1</div>
<div data-ref="modal:button">Button 2</div>
```

```typescript
const buttons = this.getAll('button')
```

### Component Properties

| Property  | Type                  | Description                              |
| --------- | --------------------- | ---------------------------------------- |
| `name`    | `string`              | The name of the component.               |
| `element` | `HTMLElement`         | The root DOM element.                    |
| `options` | `Record<string, any>` | Optional config passed to the component. |
| `data`    | `Record<string, any>` | Custom data passed to the component.     |
| `rawRefs` | `Reference[]`         | Raw references parsed from DOM.          |


## 🔗 Cross-Component Events

Your components can talk to each other using any event system like `@zoxon/eventor` — a lightweight, type-safe event system built on top of native custom events.

1. Install:

   ```bash
   npm install @zoxon/eventor
   ```

2. Update the events map type:

    ```typescript
      declare interface WindowEventMap {
        'modal:show': CustomEvent<{ id: string }>
        'modal:close': CustomEvent<{ id: string }>
      }
    ```

3. Listen an event:

   ```typescript
    import { Component } from '@zoxon/nux'
    import { listenEvent } from '@zoxon/eventor'

    export class Modal extends Component {
      close() {
        listenEvent('modal:close', (event) => {
          const { id } = event.detail
          // Handle the event, e.g., close the modal with the given id
        })

        listenEvent('modal:show', (event) => {
          const { id } = event.detail
          // Handle the event, e.g., show the modal with the given id
        })
      }
    }
   ```

4. Dispatch an event:

   ```typescript
    import { Component } from '@zoxon/nux'
    import { dispatchEvent } from '@zoxon/eventor'

    export class SomeComponent extends Component {
      showModal(id: string) {
       const button = this.get<HTMLButtonElement>('button')
        if (button) {
          button.addEventListener('click', () => {
            dispatchEvent('modal:show', { id })
          })
        }
      }
    }
   ```

 ## 🧪 Complex Component Example

```html
<div data-component="counter">
  <div data-ref="counter:result"></div>
  <button type="button" data-ref="counter:plus">+</button>
  <button type="button" data-ref="counter:minus">-</button>
</div>
```

```typescript
  import { Component, defineComponent } from '@zoxon/nux'

  // Extend Counter class
  interface Counter {
    plusButton?: HTMLButtonElement
    minusButton?: HTMLButtonElement
    result?: HTMLElement
    counter: number
  }

  class Counter extends Component {
    // Init class variables
    buildCache() {
      this.plusButton = this.get<HTMLButtonElement>('plus')
      this.minusButton = this.get<HTMLButtonElement>('minus')
      this.result = this.get<HTMLElement>('result')
      this.counter = 0
    }

    bindEvents() {
      if (this.plusButton) {
        this.plusButton.addEventListener('click', () => {
          this.counter++
          this.renderResult()
        })
      }

      if (this.minusButton) {
        this.minusButton.addEventListener('click', () => {
          this.counter--
          this.renderResult()
        })
      }
    }

    // Render result once
    init() {
      this.renderResult()
    }

    renderResult() {
      if (this.result) {
        this.result.innerHTML = this.counter.toString()
      }
    }
  }

  // Init component on element with data-component="counter" attribute
  defineComponent('counter', Counter)
```

## 🤝 Contributing

We welcome PRs, issues, and ideas! Open a discussion or submit a patch — let’s build a better component model together.

## 🪪 License

MIT © [Konstantin Velichko](https://github.com/zoxon)
