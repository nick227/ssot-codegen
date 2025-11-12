/**
 * Blog Example - UI Configuration
 * 
 * Complete blog website with custom home page and auto-generated admin pages
 */

import type { UiConfig } from '@ssot-codegen/gen'

const config: UiConfig = {
  // ============================================================================
  // SITE SETTINGS
  // ============================================================================
  site: {
    name: 'My Blog',
    title: 'Welcome to My Blog',
    description: 'Thoughts, stories, and ideas',
  },

  // ============================================================================
  // THEME
  // ============================================================================
  theme: {
    colors: {
      primary: '#2563eb',      // Blue
      secondary: '#7c3aed',    // Purple
      success: '#059669',      // Green
      warning: '#d97706',      // Orange
      error: '#dc2626',        // Red
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    darkMode: true
  },

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigation: {
    header: {
      enabled: true,
      title: 'My Blog',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' }
      ]
    },

    sidebar: {
      enabled: true,
      collapsible: true,
      sections: [
        {
          title: 'Content',
          links: [
            { label: 'Dashboard', href: '/dashboard', icon: '📊' },
            { label: 'Posts', href: '/admin/posts', icon: '📝', badge: '12' },
            { label: 'Categories', href: '/admin/categories', icon: '📁' },
            { label: 'Tags', href: '/admin/tags', icon: '🏷️' },
            { label: 'Comments', href: '/admin/comments', icon: '💬', badge: '5' }
          ]
        },
        {
          title: 'Users',
          links: [
            { label: 'All Users', href: '/admin/users', icon: '👥' },
            { label: 'Authors', href: '/admin/authors', icon: '✍️' }
          ]
        },
        {
          title: 'Settings',
          links: [
            { label: 'Profile', href: '/profile', icon: '👤', requiresAuth: true },
            { label: 'Configuration', href: '/admin/settings', icon: '⚙️', requiresAuth: true, roles: ['ADMIN'] }
          ]
        }
      ]
    },

    footer: {
      enabled: true,
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
      copyright: '© 2024 My Blog. All rights reserved.',
      social: [
        { platform: 'twitter', url: 'https://twitter.com/myblog' },
        { platform: 'github', url: 'https://github.com/myblog' }
      ]
    }
  },

  // ============================================================================
  // CUSTOM PAGES
  // ============================================================================
  pages: [
    // Public Home Page
    {
      path: 'home',
      type: 'landing',
      layout: 'landing',
      title: 'Home',
      sections: [
        {
          type: 'hero',
          config: {
            title: 'Welcome to My Blog',
            subtitle: 'Thoughts & Stories',
            description: 'Sharing ideas, experiences, and insights',
            variant: 'centered'
          }
        },
        {
          type: 'content',
          components: [
            {
              type: 'Section',
              props: {
                title: 'Recent Posts',
                subtitle: 'Latest articles from the blog',
                padding: 'lg'
              },
              children: [
                {
                  type: 'DataTable',
                  props: {
                    model: 'post',
                    columns: [
                      { key: 'title', label: 'Title' },
                      { key: 'excerpt', label: 'Excerpt' },
                      { key: 'author', label: 'Author' },
                      { key: 'publishedAt', label: 'Published' }
                    ],
                    where: { status: 'PUBLISHED', published: true },
                    orderBy: { publishedAt: 'desc' },
                    take: 10
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    // Dashboard
    {
      path: 'dashboard',
      type: 'dashboard',
      layout: 'dashboard',
      title: 'Dashboard',
      requiresAuth: true,
      roles: ['AUTHOR', 'ADMIN'],
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
                  children: [
                    { type: 'h3', children: 'Total Posts' },
                    { type: 'p', children: '156' }
                  ]
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: [
                    { type: 'h3', children: 'Total Views' },
                    { type: 'p', children: '12,345' }
                  ]
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: [
                    { type: 'h3', children: 'Comments' },
                    { type: 'p', children: '89' }
                  ]
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: [
                    { type: 'h3', children: 'Authors' },
                    { type: 'p', children: '12' }
                  ]
                }
              ]
            },

            // Recent Activity
            {
              type: 'Stack',
              props: { spacing: 6 },
              children: [
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: [
                    { type: 'h2', children: 'Recent Posts' },
                    {
                      type: 'DataTable',
                      props: {
                        model: 'post',
                        columns: [
                          { key: 'title', label: 'Title' },
                          { key: 'status', label: 'Status' },
                          { key: 'views', label: 'Views' },
                          { key: 'updatedAt', label: 'Updated' }
                        ],
                        orderBy: { updatedAt: 'desc' },
                        take: 5
                      }
                    }
                  ]
                },
                {
                  type: 'Card',
                  props: { padding: 'lg' },
                  children: [
                    { type: 'h2', children: 'Recent Comments' },
                    {
                      type: 'DataTable',
                      props: {
                        model: 'comment',
                        columns: [
                          { key: 'content', label: 'Comment' },
                          { key: 'author', label: 'Author' },
                          { key: 'createdAt', label: 'Date' }
                        ],
                        orderBy: { createdAt: 'desc' },
                        take: 5
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    // About Page
    {
      path: 'about',
      type: 'landing',
      layout: 'landing',
      title: 'About',
      sections: [
        {
          type: 'content',
          components: [
            {
              type: 'Container',
              props: { size: 'md' },
              children: [
                {
                  type: 'Section',
                  props: {
                    title: 'About This Blog',
                    subtitle: 'Learn more about who we are',
                    padding: 'xl'
                  },
                  children: 'This is a blog built with SSOT - a complete full-stack solution generated from a Prisma schema.'
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
    // CRUD Pages (Admin)
    crudPages: {
      enabled: true,
      models: ['Post', 'Category', 'Tag', 'Comment', 'User'],

      list: {
        enabled: true,
        features: ['search', 'filter', 'sort', 'pagination', 'export'],
        columns: {
          Post: ['title', 'status', 'author', 'category', 'views', 'publishedAt', 'createdAt'],
          User: ['name', 'email', 'role', 'createdAt'],
          Category: ['name', 'slug', 'createdAt'],
          Tag: ['name'],
          Comment: ['content', 'author', 'post', 'createdAt']
        }
      },

      detail: {
        enabled: true,
        features: ['edit', 'delete', 'share'],
        fields: {
          Post: ['title', 'slug', 'content', 'excerpt', 'status', 'author', 'category', 'tags', 'publishedAt'],
          User: ['name', 'email', 'bio', 'avatar', 'role', 'createdAt']
        }
      },

      form: {
        enabled: true,
        features: ['validation', 'autosave'],
        fields: {
          Post: ['title', 'content', 'excerpt', 'status', 'categoryId', 'coverImage'],
          User: ['name', 'email', 'bio', 'avatar', 'role'],
          Category: ['name', 'slug', 'description'],
          Tag: ['name']
        }
      }
    },

    // Auto-generate navigation from models
    autoNavigation: {
      enabled: false, // We defined custom navigation above
    },

    // Dashboard widgets
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post', size: 'sm' },
        { type: 'stat', title: 'Total Users', model: 'User', size: 'sm' },
        { type: 'stat', title: 'Total Comments', model: 'Comment', size: 'sm' },
        { type: 'table', title: 'Recent Posts', model: 'Post', size: 'lg' }
      ]
    }
  },

  // ============================================================================
  // COMPONENT CUSTOMIZATION
  // ============================================================================
  components: {
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
        pageSize: 20
      }
    }
  }
}

export default config

