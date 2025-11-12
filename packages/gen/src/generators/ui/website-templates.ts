/**
 * Website Templates
 * 
 * Pre-built website templates for common use cases
 * Users can start with these and customize
 */

import type { SiteConfig } from './site-builder.js'

/**
 * Blog Website Template
 */
export function createBlogTemplate(): SiteConfig {
  return {
    name: 'Blog Site',
    version: '1.0.0',
    theme: {
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626'
      }
    },
    navigation: {
      header: {
        title: 'My Blog',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Posts', href: '/posts' },
          { label: 'Categories', href: '/categories' },
          { label: 'About', href: '/about' }
        ]
      },
      footer: {
        sections: [
          {
            title: 'Content',
            links: [
              { label: 'All Posts', href: '/posts' },
              { label: 'Categories', href: '/categories' },
              { label: 'Tags', href: '/tags' }
            ]
          },
          {
            title: 'About',
            links: [
              { label: 'About Me', href: '/about' },
              { label: 'Contact', href: '/contact' }
            ]
          }
        ],
        copyright: '© 2024 My Blog'
      }
    },
    pages: [
      {
        path: 'home',
        spec: {
          layout: 'landing',
          sections: [
            {
              type: 'hero',
              props: {
                title: 'Welcome to My Blog',
                description: 'Thoughts, stories and ideas'
              }
            },
            {
              type: 'content',
              children: [
                {
                  type: 'DataTable',
                  props: {
                    model: 'post',
                    columns: [
                      { key: 'title', label: 'Title' },
                      { key: 'excerpt', label: 'Excerpt' },
                      { key: 'createdAt', label: 'Published' }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
}

/**
 * Dashboard/Admin Template
 */
export function createDashboardTemplate(): SiteConfig {
  return {
    name: 'Admin Dashboard',
    version: '1.0.0',
    theme: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }
    },
    navigation: {
      header: {
        title: 'Dashboard',
        links: []
      },
      sidebar: {
        sections: [
          {
            title: 'Main',
            links: [
              { label: 'Dashboard', href: '/dashboard', icon: '📊' },
              { label: 'Analytics', href: '/analytics', icon: '📈' }
            ]
          },
          {
            title: 'Content',
            links: [
              { label: 'Posts', href: '/posts', icon: '📝' },
              { label: 'Users', href: '/users', icon: '👥' },
              { label: 'Comments', href: '/comments', icon: '💬' }
            ]
          },
          {
            title: 'Settings',
            links: [
              { label: 'Configuration', href: '/settings', icon: '⚙️' },
              { label: 'Profile', href: '/profile', icon: '👤' }
            ]
          }
        ]
      }
    },
    pages: [
      {
        path: 'dashboard',
        spec: {
          layout: 'dashboard',
          sections: [
            {
              type: 'content',
              children: [
                {
                  type: 'Grid',
                  props: { cols: 4, gap: 6 },
                  children: [
                    {
                      type: 'Card',
                      props: { padding: 'lg' },
                      children: [
                        { type: 'h3', children: 'Total Users' },
                        { type: 'p', children: '1,234' }
                      ]
                    },
                    {
                      type: 'Card',
                      props: { padding: 'lg' },
                      children: [
                        { type: 'h3', children: 'Total Posts' },
                        { type: 'p', children: '5,678' }
                      ]
                    },
                    {
                      type: 'Card',
                      props: { padding: 'lg' },
                      children: [
                        { type: 'h3', children: 'Comments' },
                        { type: 'p', children: '9,012' }
                      ]
                    },
                    {
                      type: 'Card',
                      props: { padding: 'lg' },
                      children: [
                        { type: 'h3', children: 'Revenue' },
                        { type: 'p', children: '$12,345' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ],
    features: {
      auth: true,
      search: true
    }
  }
}

/**
 * E-commerce Template
 */
export function createEcommerceTemplate(): SiteConfig {
  return {
    name: 'E-commerce Site',
    version: '1.0.0',
    theme: {
      colors: {
        primary: '#16a34a',
        secondary: '#0891b2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#dc2626'
      }
    },
    navigation: {
      header: {
        title: 'Shop',
        links: [
          { label: 'Products', href: '/products' },
          { label: 'Categories', href: '/categories' },
          { label: 'Cart', href: '/cart' },
          { label: 'Account', href: '/account' }
        ]
      },
      footer: {
        sections: [
          {
            title: 'Shop',
            links: [
              { label: 'All Products', href: '/products' },
              { label: 'Categories', href: '/categories' },
              { label: 'Deals', href: '/deals' }
            ]
          },
          {
            title: 'Support',
            links: [
              { label: 'Help Center', href: '/help' },
              { label: 'Shipping', href: '/shipping' },
              { label: 'Returns', href: '/returns' }
            ]
          }
        ],
        copyright: '© 2024 Shop'
      }
    },
    pages: [
      {
        path: 'home',
        spec: {
          layout: 'landing',
          sections: [
            {
              type: 'hero',
              props: {
                title: 'Shop the Best Products',
                description: 'Quality products at great prices'
              }
            },
            {
              type: 'content',
              children: [
                {
                  type: 'Grid',
                  props: { cols: 4, gap: 6 },
                  children: [
                    { type: 'Card', children: 'Product 1' },
                    { type: 'Card', children: 'Product 2' },
                    { type: 'Card', children: 'Product 3' },
                    { type: 'Card', children: 'Product 4' }
                  ]
                }
              ]
            }
          ]
        }
      }
    ],
    features: {
      auth: true,
      search: true
    }
  }
}

/**
 * Landing Page Template
 */
export function createLandingTemplate(): SiteConfig {
  return {
    name: 'Landing Page',
    version: '1.0.0',
    theme: {
      colors: {
        primary: '#6366f1',
        secondary: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }
    },
    navigation: {
      header: {
        title: 'Product',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Contact', href: '#contact' }
        ]
      },
      footer: {
        sections: [
          {
            title: 'Product',
            links: [
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' }
            ]
          },
          {
            title: 'Company',
            links: [
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' }
            ]
          }
        ],
        copyright: '© 2024 Product'
      }
    },
    pages: [
      {
        path: 'home',
        spec: {
          layout: 'landing',
          sections: [
            {
              type: 'hero',
              props: {
                variant: 'centered',
                subtitle: 'Introducing',
                title: 'The Future is Here',
                description: 'Build amazing products with our platform'
              }
            },
            {
              type: 'content',
              children: [
                {
                  type: 'Section',
                  props: {
                    title: 'Features',
                    centered: true
                  },
                  children: [
                    {
                      type: 'Grid',
                      props: { cols: 3 },
                      children: [
                        { type: 'Card', children: 'Feature 1' },
                        { type: 'Card', children: 'Feature 2' },
                        { type: 'Card', children: 'Feature 3' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  }
}

/**
 * Chat template
 */
export function createChatTemplate(): SiteConfig {
  return {
    name: 'AI Chat Application',
    version: '1.0.0',
    
    theme: {
      colors: {
        primary: '#7c3aed',
        secondary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      },
      darkMode: true
    },
    
    navigation: {
      header: {
        title: 'AI Chat',
        links: [
          { label: 'Chats', href: '/chats' },
          { label: 'New Chat', href: '/chats/new' }
        ]
      }
    },
    
    pages: [],  // Pages defined in chat-template.ts
    
    features: {
      auth: true,
      search: false,
      darkMode: true
    }
  }
}

/**
 * Get template by name
 */
export function getTemplate(name: string): SiteConfig | null {
  const templates: Record<string, () => SiteConfig> = {
    blog: createBlogTemplate,
    dashboard: createDashboardTemplate,
    ecommerce: createEcommerceTemplate,
    landing: createLandingTemplate,
    chat: createChatTemplate
  }
  
  const template = templates[name.toLowerCase()]
  return template ? template() : null
}

/**
 * List available templates
 */
export function listTemplates(): Array<{ name: string; description: string }> {
  return [
    { name: 'blog', description: 'Blog website with posts and categories' },
    { name: 'dashboard', description: 'Admin dashboard with sidebar navigation' },
    { name: 'ecommerce', description: 'E-commerce site with products and cart' },
    { name: 'landing', description: 'Marketing landing page' },
    { name: 'chat', description: 'AI-powered chat with real-time messaging' }
  ]
}

