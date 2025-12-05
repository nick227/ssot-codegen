import { createQueryHook } from '../factories/useQueryFactory'

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

/**
 * Quizzes List Query Hook
 * 
 * Fetches list of available quizzes
 * Uses declarative query factory - only 5 lines!
 */
export const useQuizzes = createQueryHook({
  key: () => ['quizzes'],
  fetcher: async (sdk) => {
    const quizzes = await sdk.quiz.list({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })
    return quizzes
  },
  transformer: (data: unknown) => {
    const quizzes = data as { data: Array<{
      id: string
      title: string
      description: string | null
      category: string | null
      estimatedTime: number | null
    }> }
    
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
})

