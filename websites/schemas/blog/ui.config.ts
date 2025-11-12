/**
 * Blog Website UI Configuration
 * 
 * Base configuration for blog websites
 */

import type { UiConfig } from '@ssot-codegen/gen'

const blogUiConfig: UiConfig = {
  site: {
    name: 'Blog',
    title: 'My Blog',
    description: 'A blog website built with SSOT',
  },

  theme: {
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    darkMode: true
  },

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
            { label: 'Posts', href: '/admin/posts', icon: '📝' },
            { label: 'Categories', href: '/admin/categories', icon: '📁' },
            { label: 'Tags', href: '/admin/tags', icon: '🏷️' },
            { label: 'Comments', href: '/admin/comments', icon: '💬' }
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
            { label: 'About', href: '/about' },
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
      type: 'landing',
      layout: 'landing',
      title: 'Home',
      sections: [
        {
          type: 'hero',
          config: {
            title: 'Welcome to My Blog',
            subtitle: 'Thoughts & Stories',
            description: 'Sharing ideas, experiences, and insights'
          }
        },
        {
          type: 'content',
          components: [
            {
              type: 'Section',
              props: {
                title: 'Recent Posts',
                subtitle: 'Latest articles from the blog'
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
                    where: { published: true },
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
            {
              type: 'Grid',
              props: { cols: 4 },
              children: [
                { type: 'Card', children: [{ type: 'h3', children: 'Total Posts' }, { type: 'p', children: '0' }] },
                { type: 'Card', children: [{ type: 'h3', children: 'Total Views' }, { type: 'p', children: '0' }] },
                { type: 'Card', children: [{ type: 'h3', children: 'Comments' }, { type: 'p', children: '0' }] },
                { type: 'Card', children: [{ type: 'h3', children: 'Authors' }, { type: 'p', children: '0' }] }
              ]
            }
          ]
        }
      ]
    }
  ],

  generation: {
    crudPages: {
      enabled: true,
      models: ['Post', 'Category', 'Tag', 'Comment', 'User'],
      list: {
        enabled: true,
        features: ['search', 'filter', 'sort', 'pagination'],
        columns: {
          Post: ['title', 'status', 'author', 'category', 'views', 'publishedAt'],
          User: ['name', 'email', 'role', 'createdAt'],
          Category: ['name', 'slug', 'createdAt'],
          Tag: ['name'],
          Comment: ['content', 'author', 'post', 'createdAt']
        }
      },
      detail: {
        enabled: true,
        features: ['edit', 'delete', 'share']
      },
      form: {
        enabled: true,
        features: ['validation', 'autosave']
      }
    },
    autoNavigation: {
      enabled: false
    },
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post' },
        { type: 'stat', title: 'Total Users', model: 'User' },
        { type: 'stat', title: 'Total Comments', model: 'Comment' }
      ]
    }
  }
}

export default blogUiConfig

