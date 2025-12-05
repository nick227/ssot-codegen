import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { QuizQuestionRenderer } from '../components/quiz/QuizQuestionRenderer'
import { useQuiz } from '../hooks/useQuiz'
import { useSubmitQuiz } from '../hooks/useSubmitQuiz'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import MobileHeader from '../components/layout/MobileHeader'

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { data: quiz, isLoading } = useQuiz(quizId || '')
  const submitQuiz = useSubmitQuiz()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="profile-header" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-4">
        <EmptyState
          message="Quiz not found"
          actionLabel="Go Back"
          onAction={() => navigate(-1)}
        />
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = quiz.questions.length > 0 
    ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 
    : 0

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    // Clear error for this question
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return true
    
    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id]
      if (answer === undefined || answer === null || answer === '') {
        setErrors((prev) => ({
          ...prev,
          [currentQuestion.id]: 'This question is required',
        }))
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateCurrentQuestion()) return

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentQuestion()) return

    const submission = {
      quizId: quiz.id,
      answers: Object.entries(answers).map(([questionId, answerJson]) => ({
        questionId,
        answerJson: typeof answerJson === 'object' && answerJson !== null 
          ? answerJson as Record<string, unknown>
          : { value: answerJson },
      })),
    }

    try {
      await submitQuiz.mutateAsync(submission)
      navigate('/quizzes')
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MobileHeader title={quiz.title} showBack={true} />

      <div className="flex-1 overflow-y-auto p-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Question */}
        {currentQuestion && (
          <Card variant="result" className="mb-6">
            <QuizQuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              error={errors[currentQuestion.id]}
            />
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            loading={submitQuiz.isPending}
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

