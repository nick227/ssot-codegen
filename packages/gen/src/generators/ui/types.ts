/**
 * UI Generator Types
 */

export interface UiGeneratorConfig {
  outputDir: string
  library: 'tailwind' | 'mui' | 'chakra' | 'custom'
  generateComponentLibrary: boolean
  generateHandlers: boolean
  generatePages: boolean
}

export interface ComponentLibraryConfig {
  outputDir: string
  library: 'tailwind' | 'mui' | 'chakra'
  components: {
    static: string[]    // DataTable, Badge, etc.
    interactive: string[] // Button, Form, etc.
    data: string[]      // ListPage, DetailPage, etc.
  }
}

export interface HandlerConfig {
  outputDir: string
  handlers: string[]  // data, form, action, navigation
}

export interface PageStubConfig {
  model: string
  outputDir: string
  columns?: ColumnDef[]
  filters?: FilterDef[]
  actions?: ActionDef[]
}

export interface ColumnDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'boolean' | 'custom'
  render?: string  // Expression or function
}

export interface FilterDef {
  field: string
  type: 'text' | 'select' | 'date' | 'boolean'
  options?: string[]
}

export interface ActionDef {
  label: string
  handler: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

