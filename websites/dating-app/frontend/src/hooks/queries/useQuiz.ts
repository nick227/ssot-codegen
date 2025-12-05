import { createQueryHook } from '../factories/useQueryFactory'

export interface QuizQuestionUI {
  id: string
  quizId: string
  questionText: string
  questionType: 'multiple_choice' | 'multiple_select' | 'likert' | 'slider' | 'ranking' | 'text_input' | 'matrix'
  order: number
  required: boolean
  options?: string[]
  min?: number
  max?: number
  labels?: string[]
  answerJson?: Record<string, unknown>
}

export interface QuizUI {
  id: string
  title: string
  description: string | null
  category: string | null
  estimatedTime: number | null
  questions: QuizQuestionUI[]
}

/**
 * Quiz Detail Query Hook
 * 
 * Fetches quiz with questions
 * Uses declarative query factory - only 8 lines!
 */
export const useQuiz = createQueryHook({
  key: (quizId: string) => ['quiz', quizId],
  fetcher: async (sdk, quizId: string) => {
    const quiz = await sdk.quiz.get(quizId)
    if (!quiz) {
      throw new Error('Quiz not found')
    }
    
    // Fetch questions
    const questions = await sdk.quizquestion.list({
      where: { quizId },
      orderBy: { order: 'asc' },
    })
    
    return { quiz, questions }
  },
  transformer: (data: unknown) => {
    const { quiz, questions } = data as {
      quiz: {
        id: string
        title: string
        description: string | null
        category: string | null
        estimatedTime: number | null
      }
      questions: { data: Array<{
        id: string
        quizId: string
        type: string
        order: number
        configJson: Record<string, unknown>
      }> }
    }
    
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      estimatedTime: quiz.estimatedTime,
      questions: questions.data.map((q) => {
        const config = q.configJson
        return {
          id: q.id,
          quizId: q.quizId,
          questionText: config?.questionText as string || 'Question',
          questionType: q.type as QuizQuestionUI['questionType'],
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
  enabled: (quizId: string) => !!quizId,
})

