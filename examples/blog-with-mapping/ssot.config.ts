/**
 * SSOT CodeGen Configuration
 * Blog Template Example with Schema Mapping
 */

import type { CodegenConfig } from '@ssot-codegen/cli'

const config: CodegenConfig = {
  // Standard codegen config
  outputDir: './generated',
  clientSdk: {
    enabled: true,
    outputDir: './generated/sdk',
    format: 'typescript',
    reactHooks: true
  },
  
  // UI Generation with Blog Template
  uiProjects: [
    {
      template: 'blog',
      outputDir: './app',
      
      // ============================================================
      // SCHEMA MAPPING - Map your schema to template variables
      // ============================================================
      schemaMappings: {
        // Map your models to template models
        models: {
          // Template → Your Model
          'user': 'Author',        // Template expects 'user', you have 'Author'
          'post': 'BlogPost',      // Template expects 'post', you have 'BlogPost'
          'comment': 'Comment'     // Template expects 'comment', you have 'Comment'
        },
        
        // Map your fields to template fields
        fields: {
          // Format: 'templateModel.templateField': 'YourModel.yourField'
          
          // User/Author field mappings
          'user.name': 'Author.fullName',           // Template uses 'name', you have 'fullName'
          'user.avatar': 'Author.profileImage',     // Template uses 'avatar', you have 'profileImage'
          'user.bio': 'Author.biography',           // Template uses 'bio', you have 'biography'
          
          // Post field mappings
          'post.title': 'BlogPost.heading',         // Template uses 'title', you have 'heading'
          'post.content': 'BlogPost.body',          // Template uses 'content', you have 'body'
          'post.excerpt': 'BlogPost.summary',       // Template uses 'excerpt', you have 'summary'
          'post.author': 'BlogPost.writer',         // Template uses 'author', you have 'writer'
          'post.coverImage': 'BlogPost.featuredImage', // Template uses 'coverImage', you have 'featuredImage'
          
          // Nested field mappings (for display)
          'post.author.name': 'BlogPost.writer.fullName',  // Author name in post context
          
          // Comment field mappings (if your comment model differs)
          'comment.author': 'Comment.user',         // Template uses 'author', you have 'user'
        }
      },
      
      // ============================================================
      // CUSTOMIZATION - Override generated components
      // ============================================================
      customization: {
        // Use your own components instead of generated ones
        overrides: {
          // Override the post card component
          'components/PostCard': './custom/MyPostCard',
          
          // Override the comment section
          'components/CommentSection': './custom/MyCommentSection',
          
          // Keep layout but customize styling
          'app/(blog)/layout': './custom/BlogLayout'
        },
        
        // Extend generated components
        extends: {
          // Add custom methods to post list
          'app/(blog)/posts/page': {
            addFeaturedSection: true,
            customFilters: ['featured', 'popular']
          }
        }
      },
      
      // ============================================================
      // THEME - Customize colors and styling
      // ============================================================
      theme: {
        colors: {
          primary: '#3B82F6',
          secondary: '#64748B',
          accent: '#F59E0B'
        },
        fonts: {
          heading: 'Inter',
          body: 'Georgia'
        }
      },
      
      // ============================================================
      // FEATURES - Enable/disable template features
      // ============================================================
      features: {
        auth: true,          // Enable authentication pages
        comments: true,      // Enable comment system
        search: true,        // Enable search functionality
        seo: true,           // Generate SEO metadata
        richText: true,      // Use rich text editor
        darkMode: false      // Disable dark mode
      }
    }
  ]
}

export default config

