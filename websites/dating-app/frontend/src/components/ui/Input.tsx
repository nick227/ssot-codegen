import React from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'filter' | 'message' | 'form' | 'quiz'
  label?: string
  error?: string
}

export function Input({
  variant = 'form',
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border border-gray-300 px-4 py-3 text-base',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          {
            'bg-white': variant === 'filter' || variant === 'form' || variant === 'quiz',
            'bg-gray-50': variant === 'message',
          },
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

