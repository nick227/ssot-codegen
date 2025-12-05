import React, { useState } from 'react'
import { clsx } from 'clsx'

export interface DimensionBreakdown {
  dimensionId: string
  label: string
  compatibility: number
  weight: number
  category: 'profile' | 'quiz' | 'behavior' | 'system'
  explanation?: string
}

export interface CompatibilityBreakdownProps {
  variant?: 'compact' | 'detailed' | 'explanatory'
  overallScore: number
  dimensions: DimensionBreakdown[]
  expandable?: boolean
  className?: string
}

export function CompatibilityBreakdown({
  variant = 'detailed',
  overallScore,
  dimensions,
  expandable = false,
  className
}: CompatibilityBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(!expandable)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-400'
    return 'bg-red-500'
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Overall Score */}
      <div className="text-center">
        <div className={clsx(
          'inline-flex items-center justify-center rounded-full font-bold text-white',
          getScoreColor(overallScore),
          variant === 'detailed' ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-xl'
        )}>
          {Math.round(overallScore)}%
        </div>
      </div>

      {/* Dimension List */}
      {isExpanded && (
        <div className="space-y-3">
          {dimensions.map((dimension) => (
            <div key={dimension.dimensionId} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {dimension.label}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(dimension.compatibility)}%
                </span>
              </div>
              {variant === 'detailed' && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={clsx('h-2 rounded-full transition-all', getScoreColor(dimension.compatibility))}
                      style={{ width: `${dimension.compatibility}%` }}
                    />
                  </div>
                  {variant === 'explanatory' && dimension.explanation && (
                    <p className="text-xs italic text-gray-600">{dimension.explanation}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {expandable && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-primary hover:underline"
        >
          Show breakdown
        </button>
      )}
    </div>
  )
}

