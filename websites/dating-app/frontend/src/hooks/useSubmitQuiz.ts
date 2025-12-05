import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'
import { useCurrentUserId } from '../contexts/AuthContext'
import { useEmitBehaviorEvent } from './useEmitBehaviorEvent'

export interface QuizAnswerInput {
  questionId: string
  answerJson: Record<string, unknown>
}

export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerInput[]
}

export function useSubmitQuiz() {
  const sdk = useSDK()
  const queryClient = useQueryClient()
  const currentUserId = useCurrentUserId()
  const emitEvent = useEmitBehaviorEvent()

  return useMutation({
    mutationFn: async (submission: QuizSubmission) => {
      // Create quiz answers first
      await Promise.all(
        submission.answers.map((answer) =>
          sdk.quizanswer.create({
            quizId: submission.quizId,
            questionId: answer.questionId,
            userId: currentUserId,
            answerJson: answer.answerJson,
          })
        )
      )

      // Create quiz result
      const result = await sdk.quizresult.create({
        quizId: submission.quizId,
        userId: currentUserId,
        score: 0, // TODO: Calculate score if needed
      })

      // Emit quiz_take event via hook
      await emitEvent({
        eventType: 'quiz_take',
        targetType: 'quiz',
        targetId: submission.quizId,
        meta: {
          quiz_id: submission.quizId,
          questions_answered: submission.answers.length,
        },
      })

      return result
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] })
      queryClient.invalidateQueries({ queryKey: ['user-dimensions', currentUserId] })
      queryClient.invalidateQueries({ queryKey: ['compatibility'] })
    },
  })
}

