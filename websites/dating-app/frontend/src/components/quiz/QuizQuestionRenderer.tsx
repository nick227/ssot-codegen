import React from 'react'
import { Input } from '../ui/Input'
import { Slider } from '../ui/Slider'
import { ButtonGroup } from '../ui/ButtonGroup'
import type { QuizQuestionUI } from '../../hooks/useQuiz'

export interface QuizQuestionRendererProps {
  question: QuizQuestionUI
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export function QuizQuestionRenderer({
  question,
  value,
  onChange,
  error,
}: QuizQuestionRendererProps) {
  const renderQuestion = () => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'multiple_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const selectedValues = Array.isArray(value) ? value : []
              const isSelected = selectedValues.includes(option)
              
              return (
                <label
                  key={index}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, option])
                      } else {
                        onChange(selectedValues.filter((v) => v !== option))
                      }
                    }}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              )
            })}
          </div>
        )

      case 'likert':
        return (
          <div className="space-y-4">
            {question.labels && question.labels.length > 0 ? (
              <ButtonGroup
                variant="tabs"
                items={question.labels.map((label, index) => ({
                  id: String(index),
                  label,
                }))}
                activeId={value !== undefined ? String(value) : undefined}
                onChange={(id) => onChange(parseInt(id, 10))}
              />
            ) : (
              <Slider
                min={question.min || 1}
                max={question.max || 5}
                value={typeof value === 'number' ? value : 3}
                onChange={(val) => onChange(val)}
                step={1}
              />
            )}
          </div>
        )

      case 'slider':
        return (
          <Slider
            min={question.min || 0}
            max={question.max || 100}
            value={typeof value === 'number' ? value : 50}
            onChange={(val) => onChange(val)}
            step={question.answerJson?.step as number | undefined || 1}
          />
        )

      case 'ranking':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center p-3 border border-gray-300 rounded-lg">
                <span className="mr-3 font-bold text-gray-500">#{index + 1}</span>
                <span className="flex-1">{option}</span>
                {/* TODO: Add drag handles for reordering */}
              </div>
            ))}
          </div>
        )

      case 'text_input':
        return (
          <Input
            variant="form"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer..."
            error={error}
          />
        )

      case 'matrix':
        return (
          <div className="space-y-4">
            {/* TODO: Implement matrix question type */}
            <p className="text-gray-500">Matrix questions coming soon</p>
          </div>
        )

      default:
        return <p className="text-gray-500">Unknown question type</p>
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {question.questionText}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>
      {renderQuestion()}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}

