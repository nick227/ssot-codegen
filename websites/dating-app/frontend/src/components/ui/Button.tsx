import React from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'send' | 'action' | 'nav'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-colors min-h-[44px] min-w-[44px]',
        {
          // Variants
          'bg-primary text-white hover:bg-red-600': variant === 'primary' || variant === 'send',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-gray-100 text-gray-700 hover:bg-gray-200': variant === 'action',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'nav',
          // Sizes
          'px-3 py-1.5 text-sm': size === 'small',
          'px-6 py-3 text-base': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
          // States
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

