import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai'
import type { LLMProvider, LLMMessage, GenerateElementsResponse } from './types'
import { SYSTEM_PROMPT, GENERATE_ELEMENTS_PROMPT } from './prompts'

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Define the tool for generating map elements
const generateMapElementsTool: FunctionDeclaration = {
  name: 'generate_map_elements',
  description: 'Generate map elements (pins, areas, routes, arcs) to visualize locations, events, or geographic information on the map. Use this when the user asks about places, landmarks, historical events, routes, or anything that can be shown on a map.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: 'The search query or description of what to show on the map',
      } as const,
    },
    required: ['query'],
  },
}

export const geminiProvider: LLMProvider = {
  async chat(messages: LLMMessage[]): Promise<string> {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build conversation as a single prompt
    const conversationParts = [
      { text: `System: ${SYSTEM_PROMPT}\n\n` },
      ...messages.map((msg) => ({
        text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`,
      })),
      { text: 'Assistant: ' },
    ]

    const fullPromptText = conversationParts.map(p => p.text).join('')

    // Log the API call context
    console.log('\n========== CHAT API CALL ==========')
    console.log('Model: gemini-2.0-flash')
    console.log('Messages count:', messages.length)
    console.log('--- Full Prompt ---')
    console.log(fullPromptText)
    console.log('--- End Prompt ---\n')

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: conversationParts }],
    })
    const responseText = result.response.text()

    console.log('--- Response ---')
    console.log(responseText)
    console.log('=====================================\n')

    return responseText
  },

  async generateElements(prompt: string, context?: string): Promise<GenerateElementsResponse> {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const fullPrompt = context
      ? `${GENERATE_ELEMENTS_PROMPT}\n\nContext: ${context}\n\nUser request: ${prompt}\n\nRespond with valid JSON only, no markdown code blocks.`
      : `${GENERATE_ELEMENTS_PROMPT}\n\nUser request: ${prompt}\n\nRespond with valid JSON only, no markdown code blocks.`

    // Log the API call context
    console.log('\n========== GENERATE ELEMENTS API CALL ==========')
    console.log('Model: gemini-2.0-flash')
    console.log('User prompt:', prompt)
    console.log('Context:', context || '(none)')
    console.log('--- Full Prompt ---')
    console.log(fullPrompt)
    console.log('--- End Prompt ---\n')

    const result = await model.generateContent(fullPrompt)
    let text = result.response.text()

    console.log('--- Raw Response ---')
    console.log(text)
    console.log('--- End Raw Response ---\n')

    // Clean up potential markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(text) as GenerateElementsResponse
      console.log('--- Parsed Response ---')
      console.log(JSON.stringify(parsed, null, 2))
      console.log('=================================================\n')
      return parsed
    } catch (error) {
      console.error('Failed to parse Gemini response:', text)
      throw new Error('Failed to parse map elements from AI response')
    }
  },
}

// New unified chat function with tool calling
export async function chatWithTools(messages: LLMMessage[]): Promise<{
  content: string
  toolCalls?: { name: string; args: Record<string, unknown> }[]
}> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: [{ functionDeclarations: [generateMapElementsTool] }],
  })

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.content }],
  }))

  const chat = model.startChat({
    history,
    systemInstruction: {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }],
    },
  })

  const lastMessage = messages[messages.length - 1]

  console.log('\n========== CHAT WITH TOOLS API CALL ==========')
  console.log('Model: gemini-2.0-flash')
  console.log('Tools: generate_map_elements')
  console.log('Messages count:', messages.length)
  console.log('Last message:', lastMessage.content)
  console.log('--- History ---')
  history.forEach((h, i) => console.log(`  ${i + 1}. [${h.role}]: ${h.parts[0].text.substring(0, 100)}...`))
  console.log('--- End History ---\n')

  const result = await chat.sendMessage(lastMessage.content)
  const response = result.response

  // Check for function calls
  const functionCalls = response.functionCalls()

  if (functionCalls && functionCalls.length > 0) {
    console.log('--- Function Calls ---')
    console.log(JSON.stringify(functionCalls, null, 2))
    console.log('--- End Function Calls ---\n')

    // Return the function calls for the API route to handle
    return {
      content: response.text() || '',
      toolCalls: functionCalls.map((fc) => ({
        name: fc.name,
        args: fc.args as Record<string, unknown>,
      })),
    }
  }

  const responseText = response.text()
  console.log('--- Response ---')
  console.log(responseText)
  console.log('=================================================\n')

  return { content: responseText }
}
