import { NextRequest, NextResponse } from 'next/server'
import { chatWithTools, geminiProvider } from '@/lib/llm/gemini'
import type { ChatRequest } from '@/lib/llm/types'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      )
    }

    // Use the new chat with tools function
    const result = await chatWithTools(body.messages)

    // If there are tool calls, execute them
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolResults = []

      for (const toolCall of result.toolCalls) {
        if (toolCall.name === 'generate_map_elements') {
          const query = toolCall.args.query as string
          console.log('\n--- Executing Tool: generate_map_elements ---')
          console.log('Query:', query)

          try {
            const elementsResult = await geminiProvider.generateElements(query)
            toolResults.push({
              tool: 'generate_map_elements',
              result: elementsResult,
            })
          } catch (error) {
            console.error('Tool execution failed:', error)
            toolResults.push({
              tool: 'generate_map_elements',
              error: 'Failed to generate map elements',
            })
          }
        }
      }

      // Return chat response along with tool results
      return NextResponse.json({
        content: result.content || 'I\'ve added some elements to the map for you.',
        toolResults,
      })
    }

    // No tool calls, just return the chat response
    return NextResponse.json({ content: result.content })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
