import React, { createContext, useContext, useMemo } from 'react'
import { createSDKInstance, type SDK, type SDKConfig } from '../lib/sdk'

interface SDKContextValue {
  sdk: SDK
}

const SDKContext = createContext<SDKContextValue | null>(null)

interface SDKProviderProps {
  config: SDKConfig
  children: React.ReactNode
}

export function SDKProvider({ config, children }: SDKProviderProps) {
  const sdk = useMemo(() => createSDKInstance(config), [config])

  return (
    <SDKContext.Provider value={{ sdk }}>
      {children}
    </SDKContext.Provider>
  )
}

export function useSDK(): SDK {
  const context = useContext(SDKContext)
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider')
  }
  return context.sdk
}

