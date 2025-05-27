declare interface WindowEventMap {
  inited: CustomEvent<string>
}

interface ImportMetaEnv {
  readonly DEV?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
