'use client'

import { useChatStore } from '@/stores/chatStore'
import { useMapStore } from '@/stores/mapStore'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { toast } from 'sonner'

export function ChatPanel() {
  const { addMessage, setLoading, messages } = useChatStore()
  const { addElements, setViewState } = useMapStore()

  const handleSend = async (content: string) => {
    // Add user message
    addMessage('user', content)
    setLoading(true)

    try {
      // First, get a conversational response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
        }),
      })

      if (!chatResponse.ok) {
        throw new Error('Failed to get chat response')
      }

      const chatData = await chatResponse.json()
      addMessage('assistant', chatData.content)

      // Then, try to generate map elements if the message seems geographic
      const geographicKeywords = [
        'show', 'map', 'where', 'location', 'place', 'landmark', 'route',
        'city', 'country', 'town', 'area', 'region', 'path', 'journey',
        'visit', 'explore', 'find', 'travel', 'tour', 'historic', 'monument',
      ]
      const shouldGenerateElements = geographicKeywords.some((keyword) =>
        content.toLowerCase().includes(keyword)
      )

      if (shouldGenerateElements) {
        const elementsResponse = await fetch('/api/generate-elements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content }),
        })

        if (elementsResponse.ok) {
          const elementsData = await elementsResponse.json()
          if (elementsData.elements && elementsData.elements.length > 0) {
            addElements(elementsData.elements)
            if (elementsData.suggestedViewState) {
              setViewState(elementsData.suggestedViewState)
            }
            toast.success(`Added ${elementsData.elements.length} elements to map`)
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.')
      toast.error('Failed to process your request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold">Chat</h2>
      </div>
      <MessageList />
      <ChatInput onSend={handleSend} />
    </div>
  )
}
