import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'
import { useCurrentUserId } from '../contexts/AuthContext'

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

export function useMessageThread(matchId: string) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['message-thread', matchId],
    queryFn: async () => {
      const messages = await sdk.message.list({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
      })

      // TODO: Fetch match and other user info
      return {
        matchId,
        otherUserId: '',
        otherUserName: 'Unknown',
        messages: messages.map((msg) => ({
          id: msg.id,
          matchId: msg.matchId,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          messageType: msg.messageType,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
        })),
        unreadCount: messages.filter((m) => !m.readAt).length,
      } as MessageThread
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time feel
    enabled: !!matchId,
  })
}

export function useSendMessage() {
  const sdk = useSDK()
  const queryClient = useQueryClient()
  const currentUserId = useCurrentUserId()

  return useMutation({
    mutationFn: async ({
      matchId,
      receiverId,
      content,
    }: {
      matchId: string
      receiverId: string
      content: string
    }) => {
      const message = await sdk.message.create({
        matchId,
        senderId: currentUserId,
        receiverId,
        content,
        messageType: 'text',
      })

      return message
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch message thread
      queryClient.invalidateQueries({ queryKey: ['message-thread', variables.matchId] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

