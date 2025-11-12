/**
 * Chat UI Template
 * 
 * Complete chat interface template with:
 * - Real-time messaging (WebSocket)
 * - AI integration
 * - Conversation management
 * - Modern chat UI
 */

import type { SiteConfig } from './site-builder.js'

/**
 * Create chat application template
 */
export function createChatTemplate(): SiteConfig {
  return {
    name: 'AI Chat Application',
    version: '1.0.0',
    
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
    
    navigation: {
      header: {
        title: 'AI Chat',
        links: [
          { label: 'Chats', href: '/chats' },
          { label: 'New Chat', href: '/chats/new' }
        ]
      }
    },
    
    pages: [
      // Home page
      {
        path: 'home',
        spec: {
          layout: 'landing',
          title: 'Home',
          sections: [
            {
              type: 'hero',
              props: {
                title: 'AI-Powered Chat',
                subtitle: 'Real-time Communication',
                description: 'Chat with AI assistants powered by the latest language models',
                variant: 'centered'
              }
            },
            {
              type: 'content',
              children: [
                {
                  type: 'Container',
                  props: { size: 'md' },
                  children: [
                    {
                      type: 'Grid',
                      props: { cols: 3, gap: 6 },
                      children: [
                        {
                          type: 'Card',
                          props: { padding: 'lg', hover: true },
                          children: [
                            { type: 'h3', children: '⚡ Real-time' },
                            { type: 'p', children: 'Instant message delivery with WebSocket' }
                          ]
                        },
                        {
                          type: 'Card',
                          props: { padding: 'lg', hover: true },
                          children: [
                            { type: 'h3', children: '🤖 AI-Powered' },
                            { type: 'p', children: 'Chat with GPT-4, Claude, and more' }
                          ]
                        },
                        {
                          type: 'Card',
                          props: { padding: 'lg', hover: true },
                          children: [
                            { type: 'h3', children: '💾 History' },
                            { type: 'p', children: 'All conversations saved' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      
      // Conversations list
      {
        path: 'chats',
        spec: {
          layout: 'custom',
          title: 'Chats',
          sections: [
            {
              type: 'content',
              children: [
                {
                  type: 'Container',
                  props: { size: 'lg' },
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
                              children: 'New Chat'
                            }
                          ]
                        },
                        
                        // Conversation list
                        {
                          type: 'ConversationList'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      
      // Chat interface
      {
        path: 'chats/[id]',
        spec: {
          layout: 'custom',
          title: 'Chat',
          sections: [
            {
              type: 'custom',
              children: [
                {
                  type: 'ChatInterface',
                  props: {
                    conversationId: 'params.id'
                  }
                }
              ]
            }
          ]
        }
      }
    ],
    
    features: {
      auth: true,
      search: false,
      darkMode: true
    }
  }
}

/**
 * Create chat component specifications
 */
export function createChatComponents(): Map<string, string> {
  const components = new Map<string, string>()
  
  // ChatInterface component (already generated by plugin)
  // MessageList component (already generated by plugin)
  // MessageInput component (already generated by plugin)
  // ConversationList component (already generated by plugin)
  
  return components
}

