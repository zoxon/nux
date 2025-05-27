import { initComponents, ScopeSelector } from "../.."

interface VanillaIntegrationOptions {
  scope?: ScopeSelector
}

const init = async (options?: VanillaIntegrationOptions) => {
  return await initComponents({ scope: options?.scope || 'page' })
}

export default init
