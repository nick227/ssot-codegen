/**
 * AI Chat - UI Configuration
 * 
 * Complete chat interface with:
 * - Real-time message streaming
 * - AI-powered responses
 * - Conversation management
 * - Beautiful chat UI
 */

import type { UiConfig } from '@ssot-codegen/gen'

const config: UiConfig = {
  // Site settings
  site: {
    name: 'AI Chat',
    title: 'AI-Powered Chat Application',
    description: 'Real-time chat with AI assistance'
  },
  
  // Theme
  theme: {
    colors: {
      primary: '#7c3aed',      // Purple
      secondary: '#3b82f6',    // Blue
      success: '#10b981',      // Green
      warning: '#f59e0b',      // Orange
      error: '#ef4444',        // Red
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    darkMode: true
  },
  
  // Navigation
  navigation: {
    header: {
      enabled: true,
      title: 'AI Chat',
      links: [
        { label: 'Chats', href: '/chats' },
        { label: 'New Chat', href: '/chats/new' }
      ]
    },
    
    sidebar: {
      enabled: false  // Chat apps usually don't need sidebar
    },
    
    footer: {
      enabled: false  // Minimal footer for chat
    }
  },
  
  // Custom pages
  pages: [
    // Home page - Redirect to chats
    {
      path: 'home',
      type: 'landing',
      layout: 'landing',
      title: 'Home',
      sections: [
        {
          type: 'hero',
          config: {
            title: 'AI-Powered Chat',
            subtitle: 'Real-time Communication',
            description: 'Chat with AI assistants powered by GPT-4, Claude, and more',
            variant: 'centered'
          }
        },
        {
          type: 'content',
          components: [
            {
              type: 'Container',
              props: { size: 'md' },
              children: [
                {
                  type: 'Button',
                  props: {
                    variant: 'primary',
                    size: 'lg'
                  },
                  children: 'Start Chatting',
                  handlers: {
                    onClick: 'router.push("/chats/new")'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    
    // Chat list page
    {
      path: 'chats',
      type: 'custom',
      layout: 'dashboard',
      title: 'Conversations',
      requiresAuth: true,
      sections: [
        {
          type: 'content',
          components: [
            {
              type: 'Container',
              props: { size: 'xl' },
              children: [
                {
                  type: 'Stack',
                  props: { spacing: 6 },
                  children: [
                    // Header
                    {
                      type: 'Stack',
                      props: {
                        direction: 'horizontal',
                        justify: 'between',
                        align: 'center'
                      },
                      children: [
                        { type: 'h1', children: 'Conversations' },
                        {
                          type: 'Button',
                          props: { variant: 'primary' },
                          children: 'New Chat',
                          handlers: {
                            onClick: 'router.push("/chats/new")'
                          }
                        }
                      ]
                    },
                    
                    // Conversation list (with real-time updates)
                    {
                      type: 'DataTable',
                      props: {
                        model: 'conversation',
                        columns: [
                          { key: 'title', label: 'Title' },
                          { key: 'type', label: 'Type' },
                          { key: 'updatedAt', label: 'Last Updated' }
                        ],
                        orderBy: { updatedAt: 'desc' },
                        onRowClick: '(row) => router.push(`/chats/${row.id}`)'
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
    
    // Chat interface (custom component)
    {
      path: 'chats/[id]',
      type: 'custom',
      layout: 'custom',
      title: 'Chat',
      requiresAuth: true,
      sections: [
        {
          type: 'custom',
          components: [
            {
              type: 'ChatInterface',  // Custom chat component
              props: {
                conversationId: 'params.id'
              }
            }
          ]
        }
      ]
    }
  ],
  
  // Auto-generation settings
  generation: {
    // Generate CRUD for conversations and messages
    crudPages: {
      enabled: true,
      models: ['Conversation', 'Message', 'User'],
      
      list: {
        enabled: true,
        features: ['search', 'filter', 'sort', 'pagination'],
        columns: {
          Conversation: ['title', 'type', 'updatedAt'],
          Message: ['content', 'role', 'author', 'createdAt'],
          User: ['name', 'email', 'createdAt']
        }
      }
    }
  },
  
  // Component customization
  components: {
    defaults: {
      Button: {
        variant: 'primary',
        size: 'md'
      },
      Card: {
        padding: 'md'
      }
    }
  }
}

export default config

