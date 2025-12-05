import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'

export interface QuizQuestionUI {
  id: string
  quizId: string
  questionText: string
  questionType: 'multiple_choice' | 'multiple_select' | 'likert' | 'slider' | 'ranking' | 'text_input' | 'matrix'
  order: number
  required: boolean
  options?: string[] // For multiple choice/select
  min?: number // For slider
  max?: number // For slider
  labels?: string[] // For Likert/ranking
  answerJson?: Record<string, unknown> // Flexible answer structure
}

export interface QuizUI {
  id: string
  title: string
  description: string | null
  category: string | null
  estimatedTime: number | null
  questions: QuizQuestionUI[]
}

export function useQuiz(quizId: string) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const quiz = await sdk.quiz.get(quizId)
      if (!quiz) {
        throw new Error('Quiz not found')
      }

      // Fetch questions for this quiz
      const questions = await sdk.quizquestion.list({
        where: { quizId },
        orderBy: { order: 'asc' },
      })

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        estimatedTime: quiz.estimatedTime,
        questions: questions.data.map((q) => {
          const config = q.configJson as Record<string, unknown> | null
          return {
            id: q.id,
            quizId: q.quizId,
            questionText: config?.questionText as string || 'Question',
            questionType: q.type,
            order: q.order,
            required: config?.required as boolean || false,
            options: config?.options as string[] | undefined,
            min: config?.min as number | undefined,
            max: config?.max as number | undefined,
            labels: config?.labels as string[] | undefined,
            answerJson: config,
          }
        }),
      } as QuizUI
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!quizId,
  })
}

