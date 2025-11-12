import { describe, it, expect } from 'vitest'
import { TemplateLoader } from '../loader.js'

describe('TemplateLoader', () => {
  const createMockInput = () => ({
    template: {
      version: '1.0.0',
      runtimeVersion: '^3.0.0',
      name: 'test-template',
      pages: [
        {
          type: 'list',
          route: '/posts',
          runtime: 'server',
          model: 'post'
        }
      ]
    },
    dataContract: {
      version: '1.0.0',
      models: {
        post: {
          list: {
            pagination: { type: 'cursor', maxPageSize: 100, defaultPageSize: 20 },
            filterable: ['status'],
            sortable: ['createdAt'],
            defaultSort: [{ field: 'createdAt', dir: 'desc' }]
          },
          mutations: { create: true, update: true, delete: false }
        }
      }
    },
    capabilities: {
      version: '1.0.0',
      ui: ['Avatar', 'Badge', 'DataTable'],
      sanitize: { policy: 'basic' },
      security: { enforceGuards: true }
    },
    mappings: {
      version: '1.0.0',
      models: {},
      fields: {}
    },
    models: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      schemaPath: './prisma/schema.prisma',
      models: [
        {
          name: 'Post',
          fields: [
            { name: 'id', type: 'String', isRequired: true, isList: false, isId: true, isRelation: false },
            { name: 'title', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'status', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isRelation: false }
          ]
        }
      ],
      enums: []
    },
    theme: {
      version: '1.0.0',
      modes: ['light'],
      defaultMode: 'light',
      colors: {
        primary: { '500': '#0066cc' },
        neutral: { '500': '#666666' }
      },
      spacing: { '4': 16 },
      typography: {
        fontFamilies: { sans: 'Arial' },
        fontSizes: { base: '16px' },
        fontWeights: { normal: 400 },
        lineHeights: { normal: 1.5 }
      },
      radii: { md: '4px' }
    },
    i18n: {
      version: '1.0.0',
      pluralRules: 'simple',
      defaultLocale: 'en',
      locales: [
        {
          code: 'en',
          name: 'English',
          messages: { 'app.title': 'My App' }
        }
      ]
    },
    runtimeVersion: '3.0.0'
  })
  
  describe('load', () => {
    it('should successfully load valid template', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.plan.routes).toHaveLength(1)
        expect(result.plan.routes[0].path).toBe('/posts')
        expect(result.plan.routes[0].runtime).toBe('server')
        expect(result.plan.data).toHaveLength(1)
        expect(result.plan.data[0].model).toBe('post')
      }
    })
    
    it('should fail on invalid template', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      input.template = { version: 'invalid' } // Missing required fields
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
    
    it('should fail on version mismatch', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      input.template.runtimeVersion = '^4.0.0' // Incompatible major version
      input.runtimeVersion = '3.0.0'
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors.some(e => e.code === 'VERSION_MISMATCH')).toBe(true)
      }
    })
    
    it('should apply defaults during normalization', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      // Remove pagination from template
      delete (input.template.pages[0] as any).pagination
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        const normalized = result.plan.normalizedTemplate
        expect(normalized.pages[0].pagination).toEqual({
          type: 'pages',
          defaultSize: 20
        })
      }
    })
    
    it('should aggregate data requirements', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      
      // Add multiple pages for same model
      input.template.pages.push({
        type: 'detail',
        route: '/posts/[id]',
        runtime: 'server',
        model: 'post',
        fields: [{ field: 'title', label: 'Title' }]
      } as any)
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.plan.data).toHaveLength(1)
        expect(result.plan.data[0].operations).toContain('list')
        expect(result.plan.data[0].operations).toContain('detail')
      }
    })
    
    it('should include diagnostics', async () => {
      const loader = new TemplateLoader()
      const input = createMockInput()
      
      const result = await loader.load(input)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.diagnostics.validationTime).toBeGreaterThan(0)
        expect(result.diagnostics.normalizationTime).toBeGreaterThan(0)
        expect(result.diagnostics.planningTime).toBeGreaterThan(0)
        expect(result.diagnostics.totalTime).toBeGreaterThan(0)
        expect(result.diagnostics.stats.pages).toBe(1)
        expect(result.diagnostics.trace.length).toBeGreaterThan(0)
      }
    })
  })
})

