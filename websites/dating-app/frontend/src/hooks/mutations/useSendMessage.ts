import { createMutationHook } from '../factories/useMutationFactory'

export interface SendMessageParams {
  matchId: string
  receiverId: string
  content: string
}

/**
 * Send Message Mutation Hook
 * 
 * Sends a message in a match thread
 * Uses declarative mutation factory - only 8 lines!
 */
export const useSendMessage = createMutationHook({
  mutationFn: async (sdk, userId, params: SendMessageParams) => {
    const message = await sdk.message.create({
      matchId: params.matchId,
      senderId: userId,
      receiverId: params.receiverId,
      content: params.content,
      messageType: 'text',
    })
    return message
  },
  invalidateQueries: (params: SendMessageParams) => [
    ['message-thread', params.matchId],
    ['matches'],
  ],
})

