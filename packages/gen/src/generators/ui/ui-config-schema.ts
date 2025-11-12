/**
 * UI Configuration Schema
 * 
 * Extends ssot.config.ts with UI-specific configuration
 * Developers define pages, layouts, and components alongside their schema
 */

export interface UiConfig {
  /** Site-wide settings */
  site?: SiteSettings
  
  /** Theme configuration */
  theme?: ThemeSettings
  
  /** Navigation configuration */
  navigation?: NavigationSettings
  
  /** Page definitions (auto-generate + custom) */
  pages?: PageConfig[]
  
  /** Component overrides and customization */
  components?: ComponentConfig
  
  /** Auto-generation settings */
  generation?: GenerationSettings
}

export interface SiteSettings {
  name: string
  title?: string
  description?: string
  logo?: string
  favicon?: string
  url?: string
}

export interface ThemeSettings {
  colors?: {
    primary?: string
    secondary?: string
    success?: string
    warning?: string
    error?: string
    neutral?: string
  }
  fonts?: {
    heading?: string
    body?: string
    mono?: string
  }
  darkMode?: boolean
}

export interface NavigationSettings {
  header?: {
    enabled?: boolean
    title?: string
    logo?: string
    links?: NavLink[]
    actions?: ComponentSpec[]
  }
  sidebar?: {
    enabled?: boolean
    collapsible?: boolean
    sections?: SidebarSection[]
  }
  footer?: {
    enabled?: boolean
    sections?: FooterSection[]
    copyright?: string
    social?: SocialLink[]
  }
}

export interface NavLink {
  label: string
  href: string
  icon?: string
  badge?: string | number
  requiresAuth?: boolean
  roles?: string[]
}

export interface SidebarSection {
  title?: string
  links: NavLink[]
}

export interface FooterSection {
  title: string
  links: Array<{ label: string; href: string }>
}

export interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'facebook' | 'instagram'
  url: string
}

/**
 * Page Configuration
 * Defines individual pages and their structure
 */
export interface PageConfig {
  /** Route path (e.g., 'posts', 'dashboard', 'profile') */
  path: string
  
  /** Page type - determines auto-generation behavior */
  type?: 'list' | 'detail' | 'form' | 'dashboard' | 'landing' | 'custom'
  
  /** Model this page is associated with (for CRUD pages) */
  model?: string
  
  /** Layout to use */
  layout?: 'dashboard' | 'landing' | 'auth' | 'custom'
  
  /** Page metadata */
  title?: string
  description?: string
  requiresAuth?: boolean
  roles?: string[]
  
  /** Page sections/content */
  sections?: PageSection[]
  
  /** Override auto-generated behavior */
  overrides?: {
    disableAutoGeneration?: boolean
    customComponent?: string
  }
}

export interface PageSection {
  /** Section type */
  type: 'hero' | 'content' | 'header' | 'footer' | 'sidebar' | 'custom'
  
  /** Section configuration */
  config?: Record<string, unknown>
  
  /** Components in this section */
  components?: ComponentSpec[]
  
  /** Conditional rendering */
  visibleWhen?: string // Expression
}

export interface ComponentSpec {
  /** Component type (e.g., 'DataTable', 'Form', 'Card') */
  type: string
  
  /** Component props */
  props?: Record<string, unknown>
  
  /** Child components or content */
  children?: ComponentSpec[] | string
  
  /** Conditional rendering */
  visibleWhen?: string // Expression
  
  /** Event handlers */
  handlers?: {
    onClick?: string
    onSubmit?: string
    onChange?: string
  }
}

/**
 * Component Configuration
 * Customize component library and behavior
 */
export interface ComponentConfig {
  /** Override default components */
  overrides?: Record<string, string> // componentName -> customPath
  
  /** Component variants */
  variants?: Record<string, ComponentVariant>
  
  /** Default props for components */
  defaults?: Record<string, Record<string, unknown>>
}

export interface ComponentVariant {
  extends: string
  props?: Record<string, unknown>
  styles?: string
}

/**
 * Generation Settings
 * Control auto-generation behavior
 */
export interface GenerationSettings {
  /** Auto-generate CRUD pages for models */
  crudPages?: {
    enabled?: boolean
    models?: string[] | 'all'
    exclude?: string[]
    
    /** Customize generated pages */
    list?: {
      enabled?: boolean
      features?: ('search' | 'filter' | 'sort' | 'pagination' | 'export')[]
      columns?: Record<string, string[]> // model -> fields
    }
    
    detail?: {
      enabled?: boolean
      features?: ('edit' | 'delete' | 'share' | 'print')[]
      fields?: Record<string, string[]> // model -> fields
    }
    
    form?: {
      enabled?: boolean
      features?: ('validation' | 'autosave' | 'upload')[]
      fields?: Record<string, string[]> // model -> fields
    }
  }
  
  /** Auto-generate navigation from models */
  autoNavigation?: {
    enabled?: boolean
    models?: string[]
    groupBy?: 'none' | 'category' | 'custom'
  }
  
  /** Dashboard generation */
  dashboard?: {
    enabled?: boolean
    widgets?: DashboardWidget[]
  }
}

export interface DashboardWidget {
  type: 'stat' | 'chart' | 'table' | 'list' | 'custom'
  title: string
  model?: string
  query?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

/**
 * Example configuration
 */
export const exampleUiConfig: UiConfig = {
  site: {
    name: 'My App',
    title: 'Welcome to My App',
    description: 'Built with SSOT'
  },
  
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    },
    darkMode: true
  },
  
  navigation: {
    header: {
      enabled: true,
      title: 'My App',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' },
        { label: 'About', href: '/about' }
      ]
    },
    sidebar: {
      enabled: true,
      sections: [
        {
          title: 'Content',
          links: [
            { label: 'Posts', href: '/posts', icon: '📝' },
            { label: 'Users', href: '/users', icon: '👥' }
          ]
        }
      ]
    }
  },
  
  pages: [
    {
      path: 'dashboard',
      type: 'dashboard',
      layout: 'dashboard',
      title: 'Dashboard',
      sections: [
        {
          type: 'content',
          components: [
            {
              type: 'Grid',
              props: { cols: 3 },
              children: [
                { type: 'Card', children: 'Stats' }
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
      models: 'all',
      exclude: ['Session', 'VerificationToken'],
      list: {
        features: ['search', 'filter', 'sort', 'pagination']
      }
    },
    autoNavigation: {
      enabled: true
    },
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post' },
        { type: 'stat', title: 'Total Users', model: 'User' }
      ]
    }
  }
}

