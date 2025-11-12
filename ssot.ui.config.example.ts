/**
 * SSOT UI Configuration
 * 
 * Extend your ssot.config.ts with UI-specific settings
 * This file defines pages, layouts, components, and theme
 * 
 * Usage:
 * 1. Copy this to ssot.ui.config.ts
 * 2. Customize for your needs
 * 3. Run: npx ssot-gen ui
 */

import type { UiConfig } from '@ssot/gen'

const uiConfig: UiConfig = {
  // ============================================================================
  // SITE SETTINGS
  // ============================================================================
  site: {
    name: 'My SSOT App',
    title: 'Welcome to My App',
    description: 'Built with SSOT - Schema-Driven Development',
    logo: '/logo.svg',
    url: 'https://myapp.com'
  },

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    colors: {
      primary: '#3b82f6',      // Blue
      secondary: '#8b5cf6',    // Purple
      success: '#10b981',      // Green
      warning: '#f59e0b',      // Amber
      error: '#ef4444',        // Red
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'JetBrains Mono'
    },
    darkMode: true
  },

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigation: {
    header: {
      enabled: true,
      title: 'My App',
      logo: '/logo.svg',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' },
        { label: 'About', href: '/about' }
      ]
    },
    
    sidebar: {
      enabled: true,
      collapsible: true,
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
            { label: 'Posts', href: '/posts', icon: '📝', badge: '12' },
            { label: 'Users', href: '/users', icon: '👥' },
            { label: 'Comments', href: '/comments', icon: '💬' }
          ]
        },
        {
          title: 'Settings',
          links: [
            { label: 'Configuration', href: '/settings', icon: '⚙️', requiresAuth: true },
            { label: 'Profile', href: '/profile', icon: '👤', requiresAuth: true }
          ]
        }
      ]
    },
    
    footer: {
      enabled: true,
      sections: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Docs', href: '/docs' }
          ]
        },
        {
          title: 'Company',
          links: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Contact', href: '/contact' }
          ]
        }
      ],
      copyright: '© 2024 My App. All rights reserved.',
      social: [
        { platform: 'twitter', url: 'https://twitter.com/myapp' },
        { platform: 'github', url: 'https://github.com/myapp' }
      ]
    }
  },

  // ============================================================================
  // PAGES
  // ============================================================================
  pages: [
    // Landing Page
    {
      path: 'home',
      type: 'landing',
      layout: 'landing',
      title: 'Home',
      sections: [
        {
          type: 'hero',
          config: {
            title: 'Build Amazing Things',
            subtitle: 'Introducing',
            description: 'The fastest way to build production-ready applications',
            variant: 'centered'
          }
        },
        {
          type: 'content',
          components: [
            {
              type: 'Section',
              props: {
                title: 'Features',
                subtitle: 'Everything you need to succeed',
                centered: true,
                padding: 'xl'
              },
              children: [
                {
                  type: 'Grid',
                  props: { cols: 3, gap: 6 },
                  children: [
                    {
                      type: 'Card',
                      props: { padding: 'lg', hover: true },
                      children: 'Feature 1'
                    },
                    {
                      type: 'Card',
                      props: { padding: 'lg', hover: true },
                      children: 'Feature 2'
                    },
                    {
                      type: 'Card',
                      props: { padding: 'lg', hover: true },
                      children: 'Feature 3'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    // Dashboard Page
    {
      path: 'dashboard',
      type: 'dashboard',
      layout: 'dashboard',
      title: 'Dashboard',
      requiresAuth: true,
      sections: [
        {
          type: 'content',
          components: [
            // Stats Grid
            {
              type: 'Grid',
              props: { cols: 4, gap: 6 },
              children: [
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: 'Total Users: 1,234'
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: 'Total Posts: 5,678'
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: 'Comments: 9,012'
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: 'Revenue: $12,345'
                }
              ]
            },
            
            // Recent Posts Table
            {
              type: 'DataTable',
              props: {
                model: 'post',
                columns: [
                  { key: 'title', label: 'Title' },
                  { key: 'author', label: 'Author' },
                  { key: 'status', label: 'Status' },
                  { key: 'createdAt', label: 'Created' }
                ],
                where: { status: 'published' },
                orderBy: { createdAt: 'desc' },
                take: 10
              }
            }
          ]
        }
      ]
    },

    // Custom Page with Tabs
    {
      path: 'analytics',
      type: 'custom',
      layout: 'dashboard',
      title: 'Analytics',
      requiresAuth: true,
      sections: [
        {
          type: 'content',
          components: [
            {
              type: 'Tabs',
              props: {
                tabs: [
                  { label: 'Overview', value: 'overview' },
                  { label: 'Traffic', value: 'traffic' },
                  { label: 'Conversions', value: 'conversions' }
                ]
              },
              children: [
                {
                  type: 'Grid',
                  props: { cols: 2 },
                  children: [
                    { type: 'Card', children: 'Chart 1' },
                    { type: 'Card', children: 'Chart 2' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  // ============================================================================
  // AUTO-GENERATION SETTINGS
  // ============================================================================
  generation: {
    // CRUD Pages
    crudPages: {
      enabled: true,
      models: 'all',
      exclude: ['Session', 'VerificationToken', 'Account'],
      
      list: {
        enabled: true,
        features: ['search', 'filter', 'sort', 'pagination', 'export'],
        // Customize columns per model
        columns: {
          Post: ['title', 'author', 'status', 'createdAt'],
          User: ['name', 'email', 'role', 'createdAt'],
          Comment: ['content', 'author', 'post', 'createdAt']
        }
      },
      
      detail: {
        enabled: true,
        features: ['edit', 'delete', 'share'],
        // Customize fields per model
        fields: {
          Post: ['title', 'content', 'status', 'author', 'tags', 'createdAt'],
          User: ['name', 'email', 'role', 'bio', 'createdAt']
        }
      },
      
      form: {
        enabled: true,
        features: ['validation', 'autosave'],
        // Customize editable fields per model
        fields: {
          Post: ['title', 'content', 'status', 'tags'],
          User: ['name', 'email', 'role', 'bio']
        }
      }
    },
    
    // Auto-generate navigation from models
    autoNavigation: {
      enabled: true,
      models: ['Post', 'User', 'Comment', 'Category'],
      groupBy: 'category'
    },
    
    // Dashboard widgets
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post', size: 'sm' },
        { type: 'stat', title: 'Total Users', model: 'User', size: 'sm' },
        { type: 'stat', title: 'Total Comments', model: 'Comment', size: 'sm' },
        { type: 'table', title: 'Recent Posts', model: 'Post', size: 'lg' },
        { type: 'chart', title: 'Post Trends', model: 'Post', size: 'md' }
      ]
    }
  },

  // ============================================================================
  // COMPONENT CUSTOMIZATION
  // ============================================================================
  components: {
    // Override default components
    overrides: {
      // 'DataTable': './components/custom/MyDataTable',
      // 'Form': './components/custom/MyForm'
    },
    
    // Default props for components
    defaults: {
      Button: {
        variant: 'primary',
        size: 'md'
      },
      Card: {
        padding: 'md',
        hover: true
      },
      DataTable: {
        pageSize: 20,
        enableExport: true
      }
    }
  }
}

export default uiConfig

