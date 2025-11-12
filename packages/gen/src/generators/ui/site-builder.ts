/**
 * Site Builder
 * 
 * Generates complete websites from JSON configuration
 * Orchestrates page composition, routing, and component generation
 */

import type { ParsedSchema } from '../../dmmf-parser.js'
import { generatePages, type PageSpec } from './page-composer.js'

export interface SiteConfig {
  name: string
  version: string
  theme?: ThemeConfig
  pages: PageDefinition[]
  navigation?: NavigationConfig
  features?: FeatureConfig
}

export interface PageDefinition {
  path: string
  spec: PageSpec
}

export interface ThemeConfig {
  colors?: {
    primary?: string
    secondary?: string
    success?: string
    warning?: string
    error?: string
  }
  fonts?: {
    heading?: string
    body?: string
  }
}

export interface NavigationConfig {
  header?: {
    logo?: string
    title?: string
    links: Array<{ label: string; href: string }>
  }
  sidebar?: {
    sections: Array<{
      title?: string
      links: Array<{ label: string; href: string; icon?: string }>
    }>
  }
  footer?: {
    sections: Array<{
      title: string
      links: Array<{ label: string; href: string }>
    }>
    copyright?: string
  }
}

export interface FeatureConfig {
  auth?: boolean
  search?: boolean
  i18n?: boolean
  darkMode?: boolean
}

/**
 * Generate complete site from configuration
 */
export function generateSite(
  config: SiteConfig,
  schema: ParsedSchema,
  outputDir: string
): Map<string, string> {
  const files = new Map<string, string>()
  
  // Generate pages
  const pageFiles = generatePages({
    outputDir,
    pages: new Map(config.pages.map(p => [p.path, p.spec])),
    schema
  })
  
  for (const [path, content] of pageFiles) {
    files.set(path, content)
  }
  
  // Generate layout components
  if (config.navigation) {
    files.set(`${outputDir}/components/AppHeader.tsx`, generateAppHeader(config.navigation))
    files.set(`${outputDir}/components/AppSidebar.tsx`, generateAppSidebar(config.navigation))
    files.set(`${outputDir}/components/AppFooter.tsx`, generateAppFooter(config.navigation))
  }
  
  // Generate theme configuration
  if (config.theme) {
    files.set(`${outputDir}/config/theme.ts`, generateThemeConfig(config.theme))
  }
  
  // Generate site manifest
  files.set(`${outputDir}/site.json`, JSON.stringify(config, null, 2))
  
  return files
}

/**
 * Generate App Header component
 */
function generateAppHeader(nav: NavigationConfig): string {
  const headerConfig = nav.header || { links: [] }
  
  return `/**
 * App Header
 * Generated from site configuration
 */

'use client'

import { Header } from '@ssot-ui/shared'

export function AppHeader() {
  return (
    <Header
      ${headerConfig.title ? `title="${headerConfig.title}"` : ''}
      links={${JSON.stringify(headerConfig.links, null, 2)}}
    />
  )
}
`
}

/**
 * Generate App Sidebar component
 */
function generateAppSidebar(nav: NavigationConfig): string {
  const sidebarConfig = nav.sidebar || { sections: [] }
  
  return `/**
 * App Sidebar
 * Generated from site configuration
 */

'use client'

import { Sidebar } from '@ssot-ui/shared'

export function AppSidebar() {
  return (
    <Sidebar
      sections={${JSON.stringify(sidebarConfig.sections, null, 2)}}
    />
  )
}
`
}

/**
 * Generate App Footer component
 */
function generateAppFooter(nav: NavigationConfig): string {
  const footerConfig = nav.footer || { sections: [] }
  
  return `/**
 * App Footer
 * Generated from site configuration
 */

'use client'

import { Footer } from '@ssot-ui/shared'

export function AppFooter() {
  return (
    <Footer
      sections={${JSON.stringify(footerConfig.sections, null, 2)}}
      ${footerConfig.copyright ? `copyright="${footerConfig.copyright}"` : ''}
    />
  )
}
`
}

/**
 * Generate theme configuration
 */
function generateThemeConfig(theme: ThemeConfig): string {
  return `/**
 * Theme Configuration
 * Generated from site configuration
 */

export const theme = ${JSON.stringify(theme, null, 2)}

export default theme
`
}

/**
 * Create example site configuration
 */
export function createExampleSiteConfig(): SiteConfig {
  return {
    name: 'My SSOT App',
    version: '1.0.0',
    theme: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    navigation: {
      header: {
        title: 'My App',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Posts', href: '/posts' },
          { label: 'About', href: '/about' }
        ]
      },
      footer: {
        sections: [
          {
            title: 'Product',
            links: [
              { label: 'Features', href: '/features' },
              { label: 'Pricing', href: '/pricing' }
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
        copyright: '© 2024 My App. All rights reserved.'
      }
    },
    pages: [
      {
        path: 'home',
        spec: {
          layout: 'landing',
          title: 'Home',
          sections: [
            {
              type: 'hero',
              props: {
                title: 'Welcome to My App',
                subtitle: 'Build amazing things',
                description: 'The best platform for your next project'
              }
            }
          ]
        }
      },
      {
        path: 'dashboard',
        spec: {
          layout: 'dashboard',
          title: 'Dashboard',
          sections: [
            {
              type: 'content',
              children: [
                {
                  type: 'Grid',
                  props: { cols: 3 },
                  children: [
                    { type: 'Card', children: 'Stats 1' },
                    { type: 'Card', children: 'Stats 2' },
                    { type: 'Card', children: 'Stats 3' }
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
      search: true,
      darkMode: false
    }
  }
}

/**
 * Load site configuration from JSON file
 */
export function loadSiteConfig(jsonPath: string): SiteConfig {
  // This would be implemented to read from filesystem
  // For now, return example config
  return createExampleSiteConfig()
}

/**
 * Validate site configuration
 */
export function validateSiteConfig(config: SiteConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.name) {
    errors.push('Site name is required')
  }
  
  if (!config.version) {
    errors.push('Site version is required')
  }
  
  if (!config.pages || config.pages.length === 0) {
    errors.push('At least one page is required')
  }
  
  // Validate page paths
  const paths = new Set<string>()
  config.pages.forEach(page => {
    if (paths.has(page.path)) {
      errors.push(`Duplicate page path: ${page.path}`)
    }
    paths.add(page.path)
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

