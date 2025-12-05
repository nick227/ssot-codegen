import React, { useState, useRef } from 'react'
import { clsx } from 'clsx'

export interface CardStackProps<T> {
  cards: T[]
  renderCard: (card: T, index?: number) => React.ReactNode
  onSwipe?: (card: T, direction: 'left' | 'right') => void
  className?: string
}

const SWIPE_THRESHOLD = 0.3 // 30% of screen width

export function CardStack<T>({
  cards,
  renderCard,
  onSwipe,
  className
}: CardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const visibleCards = cards.slice(currentIndex, currentIndex + 5)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStartRef.current.x
    const deltaY = touch.clientY - dragStartRef.current.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleTouchEnd = () => {
    if (!dragStartRef.current || !cardRef.current) return
    
    const cardWidth = cardRef.current.offsetWidth
    const swipeRatio = dragOffset.x / cardWidth

    if (Math.abs(swipeRatio) > SWIPE_THRESHOLD && cards[currentIndex]) {
      const direction = swipeRatio > 0 ? 'right' : 'left'
      onSwipe?.(cards[currentIndex], direction)
      setCurrentIndex((prev) => prev + 1)
    }

    setDragOffset({ x: 0, y: 0 })
    setIsDragging(false)
    dragStartRef.current = null
  }

  if (cards.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-gray-500">No more profiles</p>
      </div>
    )
  }

  return (
    <div className={clsx('relative w-full', className)}>
      {visibleCards.map((card, index) => {
        const isTopCard = index === 0
        const offset = index * 8
        const rotation = index * 2

        return (
          <div
            key={currentIndex + index}
            ref={isTopCard ? cardRef : undefined}
            className={clsx(
              'absolute w-full transition-transform',
              isTopCard && isDragging && 'transition-none'
            )}
            style={{
              left: `${isTopCard ? dragOffset.x : 0}px`,
              top: `${offset + (isTopCard ? dragOffset.y : 0)}px`,
              transform: `translate(0, 0) rotate(${isTopCard ? dragOffset.x * 0.1 : rotation}deg)`,
              zIndex: visibleCards.length - index,
              opacity: isTopCard ? 1 : 1 - index * 0.2,
            }}
            onTouchStart={isTopCard ? handleTouchStart : undefined}
            onTouchMove={isTopCard ? handleTouchMove : undefined}
            onTouchEnd={isTopCard ? handleTouchEnd : undefined}
          >
            {renderCard(card, currentIndex + index)}
          </div>
        )
      })}
    </div>
  )
}

