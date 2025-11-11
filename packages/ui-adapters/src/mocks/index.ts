/**
 * Mock Adapters for Testing
 * 
 * Use these for testing without real services.
 */

import type {
  DataAdapter,
  UIAdapter,
  AuthAdapter,
  RouterAdapter,
  FormatAdapter,
  Result,
  ListResult,
  Guard,
  User,
  SanitizePolicy
} from '../index.js'

// ============================================================================
// Mock Data Adapter
// ============================================================================

export const MockDataAdapter: DataAdapter = {
  async list(model, params) {
    return {
      ok: true,
      data: {
        items: [],
        total: 0
      }
    }
  },
  
  async detail(model, id) {
    return {
      ok: true,
      data: { id, model } as any
    }
  },
  
  async create(model, data) {
    return {
      ok: true,
      data: { id: 'mock-id', ...data } as any
    }
  },
  
  async update(model, id, data) {
    return {
      ok: true,
      data: { id, ...data } as any
    }
  },
  
  async delete(model, id) {
    return {
      ok: true,
      data: undefined
    }
  },
  
  async search(model, params) {
    return {
      ok: true,
      data: {
        items: [],
        total: 0
      }
    }
  }
}

// ============================================================================
// Mock Auth Adapter
// ============================================================================

export const MockAuthAdapter: AuthAdapter = {
  async can(guard) {
    return true // Always allow for testing
  },
  
  async getCurrentUser() {
    return {
      id: 'mock-user',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['admin']
    }
  },
  
  redirectToLogin() {
    console.log('Mock: Redirect to login')
  },
  
  async hasRole(role) {
    return true
  },
  
  async hasPermission(permission) {
    return true
  }
}

// ============================================================================
// Mock Router Adapter
// ============================================================================

export const MockRouterAdapter: RouterAdapter = {
  Link: ({ href, children }) => <a href={href}>{children}</a>,
  
  useParams: () => ({}),
  
  useSearchParams: () => ({}),
  
  useNavigate: () => async (path) => ({ ok: true, data: undefined }),
  
  redirect: (path) => {
    console.log(`Mock: Redirect to ${path}`)
  },
  
  usePathname: () => '/',
  
  isActive: (path) => false
}

// ============================================================================
// Mock Format Adapter
// ============================================================================

export const MockFormatAdapter: FormatAdapter = {
  formatDate: (date) => new Date(date).toLocaleDateString(),
  
  formatNumber: (value) => value.toString(),
  
  formatCurrency: (amount, currency) => `$${amount.toFixed(2)}`,
  
  sanitizeHTML: (html) => html, // No sanitization in mock
  
  truncate: (text, length, suffix = '...') => 
    text.length > length ? text.substring(0, length) + suffix : text,
  
  formatRelative: (date) => 'just now',
  
  pluralize: (count, singular, plural) => count === 1 ? singular : plural
}

