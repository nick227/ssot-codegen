import { createMutationHook } from '../factories/useMutationFactory'

export interface QuizAnswerInput {
  questionId: string
  answerJson: Record<string, unknown>
}

export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerInput[]
}

/**
 * Submit Quiz Mutation Hook
 * 
 * Submits quiz answers and creates result
 * Uses declarative mutation factory - only 10 lines!
 */
export const useSubmitQuiz = createMutationHook({
  mutationFn: async (sdk, userId, submission: QuizSubmission) => {
    // Create quiz answers first
    await Promise.all(
      submission.answers.map((answer) =>
        sdk.quizanswer.create({
          quizId: submission.quizId,
          questionId: answer.questionId,
          userId,
          answerJson: answer.answerJson,
        })
      )
    )

    // Create quiz result
    const result = await sdk.quizresult.create({
      quizId: submission.quizId,
      userId,
      score: 0, // TODO: Calculate score if needed
    })

    return result
  },
  invalidateQueries: (submission: QuizSubmission, userId: string) => [
    ['quizzes'],
    ['quiz', submission.quizId],
    ['user-dimensions', userId],
    ['compatibility'],
  ],
})

