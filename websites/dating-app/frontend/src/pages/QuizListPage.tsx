import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useQuizzes } from '../hooks/useQuizzes'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import MobileHeader from '../components/layout/MobileHeader'

export default function QuizListPage() {
  const navigate = useNavigate()
  const { data: quizzes = [], isLoading } = useQuizzes()

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="card-list" count={3} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <MobileHeader title="Quizzes" showBack={true} />

      <div className="flex-1 overflow-y-auto p-4">
        {quizzes.length === 0 ? (
          <EmptyState
            message="No quizzes available"
            subMessage="Check back later for new quizzes!"
          />
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                variant="result"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
                className="cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                    {quiz.completed && (
                      <Badge variant="success" size="small">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {quiz.category && (
                      <span className="capitalize">{quiz.category}</span>
                    )}
                    {quiz.estimatedTime && (
                      <span>~{quiz.estimatedTime} min</span>
                    )}
                    {quiz.questionCount !== undefined && (
                      <span>{quiz.questionCount} questions</span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/quiz/${quiz.id}`)
                    }}
                  >
                    {quiz.completed ? 'Retake Quiz' : 'Start Quiz'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

