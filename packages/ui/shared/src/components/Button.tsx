/**
 * Button Component - Shared across templates
 * 
 * Used in:
 * - Blog: Submit comments, create/edit posts, pagination
 * - Chatbot: Send message, clear chat, settings
 * - Admin: CRUD actions, filters, exports
 */

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 border-primary-600',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 border-secondary-600',
  outline: 'bg-transparent border-neutral-300 text-neutral-700 hover:bg-neutral-50',
  ghost: 'bg-transparent border-transparent text-neutral-700 hover:bg-neutral-100',
  danger: 'bg-error-600 text-white hover:bg-error-700 border-error-600'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}

/**
 * SHARED COMPONENT
 * 
 * Standard button used everywhere:
 * 
 * 1. Blog:
 *    <Button onClick={submitComment}>Post Comment</Button>
 *    <Button variant="danger" onClick={deletePost}>Delete</Button>
 * 
 * 2. Chatbot:
 *    <Button variant="primary" onClick={sendMessage}>Send</Button>
 *    <Button variant="ghost" onClick={clearChat}>Clear</Button>
 * 
 * 3. Admin:
 *    <Button variant="outline" onClick={exportData}>Export CSV</Button>
 *    <Button isLoading={saving}>Save</Button>
 */

