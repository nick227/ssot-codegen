/**
 * E-commerce Website UI Configuration
 */

import type { UiConfig } from '@ssot-codegen/gen'

const ecommerceUiConfig: UiConfig = {
  site: {
    name: 'E-commerce Store',
    title: 'My Store',
    description: 'An e-commerce website built with SSOT',
  },

  theme: {
    colors: {
      primary: '#dc2626',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    darkMode: false
  },

  navigation: {
    header: {
      enabled: true,
      title: 'My Store',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' }
      ]
    },
    footer: {
      enabled: true,
      sections: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', href: '/products' },
            { label: 'Categories', href: '/categories' },
            { label: 'Sale', href: '/sale' }
          ]
        },
        {
          title: 'Customer Service',
          links: [
            { label: 'Contact', href: '/contact' },
            { label: 'Shipping', href: '/shipping' },
            { label: 'Returns', href: '/returns' }
          ]
        }
      ],
      copyright: '© 2024 My Store'
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
            title: 'Welcome to My Store',
            subtitle: 'Discover Amazing Products'
          }
        }
      ]
    }
  ],

  generation: {
    crudPages: {
      enabled: true,
      models: ['Product', 'Category', 'Order', 'Review'],
      list: {
        enabled: true,
        features: ['search', 'filter', 'sort', 'pagination'],
        columns: {
          Product: ['name', 'price', 'inventory', 'category', 'published'],
          Category: ['name', 'slug', 'products'],
          Order: ['orderNumber', 'status', 'total', 'customerName', 'createdAt'],
          Review: ['rating', 'title', 'product', 'approved']
        }
      }
    }
  }
}

export default ecommerceUiConfig

