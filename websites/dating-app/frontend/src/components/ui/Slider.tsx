import React from 'react'
import { clsx } from 'clsx'

export interface SliderProps {
  variant?: 'full' | 'quick' | 'quiz'
  min?: number
  max?: number
  value: number
  onChange: (value: number) => void
  label?: string
  step?: number
  className?: string
}

export function Slider({
  min = 0,
  max = 10,
  value,
  onChange,
  label,
  step = 0.1,
  className
}: SliderProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-gray-500">{value.toFixed(1)}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  )
}

