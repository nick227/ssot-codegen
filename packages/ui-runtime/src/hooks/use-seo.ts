/**
 * useSEO Hook
 * 
 * Injects SEO metadata from JSON configuration.
 * No ad-hoc per-page TypeScript needed.
 */

import { useEffect } from 'react'
import type { SEO } from '@ssot-ui/schemas'

/**
 * Apply SEO metadata from JSON
 */
export function useSEO(seo: SEO | undefined, data?: Record<string, unknown>) {
  useEffect(() => {
    if (!seo) return
    
    // Interpolate template variables
    const interpolate = (template: string): string => {
      if (!data) return template
      
      return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
        const value = getNestedValue(data, path)
        return value !== undefined ? String(value) : match
      })
    }
    
    // Set title
    if (seo.title) {
      document.title = interpolate(seo.title)
    }
    
    // Set meta description
    if (seo.description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', interpolate(seo.description))
    }
    
    // Set canonical
    if (seo.canonical) {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', interpolate(seo.canonical))
    }
    
    // Set Open Graph image
    if (seo['og:image']) {
      let meta = document.querySelector('meta[property="og:image"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', 'og:image')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', interpolate(seo['og:image']))
    }
  }, [seo, data])
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj)
}

