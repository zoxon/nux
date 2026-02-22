# @zoxon/nux

## 2.0.0

### Major Changes

**Two-phase initialization** replaces the centralized registry model. Components no longer rely on a
global map — each instance self-registers with a counter. Phase 1 (`init()`) runs for every
component before Phase 2 (`start()`) begins for any, eliminating broadcast event race conditions
where later-initialized components missed events dispatched by earlier ones.

#### Breaking Changes

- **`defineComponent` / `registerComponent` removed.** Use `initComponent(name, Class)` to scan
  the DOM and instantiate components.

  ```ts
  // before
  defineComponent('counter', Counter)
  initComponents()

  // after
  initComponent('counter', Counter)
  markAppReady()
  ```

- **`initComponents()` removed.** Call `markAppReady()` once the DOM is ready. The framework
  handles Phase 1 → Phase 2 sequencing automatically.

- **`Component` constructor changed** from `(name, element, options)` to `(name, element)`.
  The `options` field and `get defaults()` getter are removed from the base class.

- **`buildCache()` removed.** DOM queries can be performed directly inside `init()`.

- **`bindEvents()` removed.** Register listeners using the new `this.on()` method inside `init()`.

- **`options` / `defaults` removed** from the base class. Pass configuration via `data-*`
  attributes or your own class fields.

- **Centralized registry removed.** `initComponent()` queries `[data-component="name"]` on every
  call; there is no global component map.

#### New Features

- **`this.on()` — event listener with automatic cleanup.**
  Listeners registered via `this.on()` are removed automatically when `destroy()` is called.

  ```ts
  // window custom event
  this.on('modal:close', (e) => { /* e.detail typed */ })

  // DOM element event (null-safe — skipped silently if element is null)
  this.on(this.get('btn'), 'click', (e) => { /* ... */ })
  ```

- **`this.emit()` — event dispatcher.**

  ```ts
  // broadcast on window
  this.emit('counter:updated', { value: this.count })

  // dispatch on a DOM element (bubbles + composed)
  this.emit(this.get('btn'), 'custom:event', { payload: 42 })
  ```

- **`this.onStart(callback)` — Vue 3 setup-style API.**
  Schedule Phase 2 code from within `init()`, keeping both phases in a single method.

  ```ts
  async init() {
    let count = 0
    this.on('counter:reset', () => { count = 0 })

    this.onStart(() => {
      this.emit('counter:ready', { initial: count })
    })
  }
  ```

- **`markAppReady()`** — explicit signal that the DOM is ready and Phase 1 can begin.

- **`onAppReady(cb)` / `onSetupComplete(cb)`** — subscribe to lifecycle events from outside a
  component (fires immediately if the phase has already passed).

- **`@zoxon/eventor` integration** — event helpers `dispatchCustomEvent` and `listenEvent` are
  re-exported from `@zoxon/nux`. Augment `WindowEventMap` once to get full type safety across all
  `on()` / `emit()` calls.

---

## 1.1.0

### Minor Changes

- bb2f4a3: Added explicit "types" field to exports for better TypeScript support.

## 1.0.2

### Patch Changes

- Fix package.json exports and update tsup config

## 1.0.1

### Patch Changes

- Fix config

## 1.0.0

### Major Changes

- Initial release with core functionality.
