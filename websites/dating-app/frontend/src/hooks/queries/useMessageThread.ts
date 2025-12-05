import { createQueryHook } from '../factories/useQueryFactory'

export interface Message {
  id: string
  matchId: string
  senderId: string
  receiverId: string
  content: string
  messageType: string
  readAt: Date | null
  createdAt: Date
}

export interface MessageThread {
  matchId: string
  otherUserId: string
  otherUserName: string
  messages: Message[]
  unreadCount: number
}

/**
 * Message Thread Query Hook
 * 
 * Fetches message thread for a match
 * Uses declarative query factory - only 10 lines!
 */
const useMessageThreadBase = createQueryHook({
  key: (matchId: string) => ['message-thread', matchId],
  fetcher: async (sdk, matchId: string) => {
    const messages = await sdk.message.list({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    })
    return messages
  },
  transformer: (data: unknown) => {
    const messages = data as { data: Array<{
      id: string
      matchId: string
      senderId: string
      receiverId: string
      content: string
      messageType: string
      readAt: Date | null
      createdAt: Date
    }> }
    
    // TODO: Fetch match and other user info
    return {
      matchId: messages.data[0]?.matchId || '',
      otherUserId: '',
      otherUserName: 'Unknown',
      messages: messages.data.map((msg) => ({
        id: msg.id,
        matchId: msg.matchId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        messageType: msg.messageType,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
      })),
      unreadCount: messages.data.filter((m) => !m.readAt).length,
    } as MessageThread
  },
  staleTime: 30 * 1000, // 30 seconds
  enabled: (matchId: string) => !!matchId,
  options: {
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time feel
  },
})

export function useMessageThread(matchId: string) {
  return useMessageThreadBase(matchId)
}

