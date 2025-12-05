import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'

export interface QuizSummary {
  id: string
  title: string
  description: string | null
  category: string | null
  estimatedTime: number | null
  questionCount?: number
  completed?: boolean
  completedAt?: Date
}

export function useQuizzes() {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const quizzes = await sdk.quiz.list({
        take: 50,
        orderBy: { createdAt: 'desc' },
      })

      return quizzes.data.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        estimatedTime: quiz.estimatedTime,
        questionCount: undefined, // TODO: Fetch question count
        completed: false, // TODO: Check if user completed this quiz
        completedAt: undefined,
      })) as QuizSummary[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

