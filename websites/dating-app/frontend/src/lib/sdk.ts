// Import SDK from backend
// Note: In production, this should be a published package or properly linked workspace dependency
import { createSDK, type SDK, type SDKConfig } from '../../../src/src/sdk/index.js'

let sdkInstance: SDK | null = null

export function createSDKInstance(config: SDKConfig): SDK {
  sdkInstance = createSDK(config)
  return sdkInstance
}

export function getSDK(): SDK {
  if (!sdkInstance) {
    throw new Error('SDK not initialized. Call createSDKInstance first.')
  }
  return sdkInstance
}

export type { SDK, SDKConfig }

