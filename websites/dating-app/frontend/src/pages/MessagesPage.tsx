import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ListView } from '../components/layout/ListView'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { MediaLoader } from '../components/ui/MediaLoader'
import { Badge } from '../components/ui/Badge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { useMatches } from '../hooks/useMatches'
import { useMessageThread, useSendMessage } from '../hooks/useMessageThread'
import { useEmitBehaviorEvent } from '../hooks/useEmitBehaviorEvent'
import { useCurrentUserId } from '../contexts/AuthContext'
import { getProfilePhotos } from '../utils/profile'
import { clsx } from 'clsx'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const matchId = searchParams.get('matchId')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = useCurrentUserId()

  const { data: matches = [] } = useMatches(currentUserId)
  const { data: thread, isLoading: threadLoading } = useMessageThread(matchId || '')
  const sendMessage = useSendMessage()
  const emitEvent = useEmitBehaviorEvent()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !matchId || !thread) return

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      matchId,
      senderId: currentUserId,
      receiverId: thread.otherUserId,
      content: messageInput.trim(),
      messageType: 'text',
      readAt: null,
      createdAt: new Date(),
    }

    // Optimistic update
    setMessageInput('')

    try {
      await sendMessage.mutateAsync({
        matchId,
        receiverId: thread.otherUserId,
        content: messageInput.trim(),
      })

      emitEvent({
        eventType: 'message_sent',
        targetType: 'message',
        targetId: optimisticMessage.id,
        meta: {
          match_id: matchId,
          receiver_id: thread.otherUserId,
          message_length: messageInput.trim().length,
        },
      })
    } catch (error) {
      // Revert optimistic update on error
      setMessageInput(optimisticMessage.content)
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Thread List View
  if (!matchId) {
    const renderThreadCard = (match: typeof matches[0]) => {
      const photos = getProfilePhotos(match)

      return (
        <Card
          key={match.matchId}
          variant="thread"
          onClick={() => navigate(`/messages?matchId=${match.matchId}`)}
          className="flex gap-4 p-4"
        >
          <div className="flex-shrink-0">
            <MediaLoader variant="single" images={photos} className="w-12 h-12 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">{match.name}</h3>
              {match.unreadCount && match.unreadCount > 0 && (
                <Badge variant="unread" size="small">
                  {match.unreadCount}
                </Badge>
              )}
            </div>
            {match.lastMessage && (
              <p className="text-sm text-gray-600 truncate">
                {match.lastMessage.content}
              </p>
            )}
            {match.lastMessage && (
              <span className="text-xs text-gray-500">
                {new Date(match.lastMessage.sentAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </Card>
      )
    }

    return (
      <div className="p-4">
        <ListView
          items={matches}
          renderItem={renderThreadCard}
          emptyState={
            <EmptyState
              message="No conversations yet"
              subMessage="Start swiping to find matches!"
            />
          }
        />
      </div>
    )
  }

  // Conversation View
  if (threadLoading) {
    return (
      <div className="p-4 space-y-4">
        <LoadingSkeleton variant="message-list" count={3} />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Thread not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((message) => {
          const isSent = message.senderId === currentUserId

          return (
            <div
              key={message.id}
              className={clsx('flex', isSent ? 'justify-end' : 'justify-start')}
            >
              <div
                className={clsx(
                  'max-w-[75%] rounded-2xl px-4 py-2',
                  isSent
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-900'
                )}
              >
                <p className="text-sm">{message.content}</p>
                <span
                  className={clsx(
                    'text-xs mt-1 block',
                    isSent ? 'text-white/70' : 'text-gray-500'
                  )}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white safe-bottom">
        <div className="flex gap-2">
          <Input
            variant="message"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            variant="send"
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendMessage.isPending}
            loading={sendMessage.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
