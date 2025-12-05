import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SDKProvider } from './contexts/SDKContext'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SDKProvider config={{ baseUrl: apiUrl }}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </SDKProvider>
  </React.StrictMode>,
)

