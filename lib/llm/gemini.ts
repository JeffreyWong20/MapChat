import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMProvider, LLMMessage, GenerateElementsResponse } from './types'
import { SYSTEM_PROMPT, GENERATE_ELEMENTS_PROMPT } from './prompts'

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: conversationParts }],
    })
    return result.response.text()
  },

  async generateElements(prompt: string, context?: string): Promise<GenerateElementsResponse> {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const fullPrompt = context
      ? `${GENERATE_ELEMENTS_PROMPT}\n\nContext: ${context}\n\nUser request: ${prompt}\n\nRespond with valid JSON only, no markdown code blocks.`
      : `${GENERATE_ELEMENTS_PROMPT}\n\nUser request: ${prompt}\n\nRespond with valid JSON only, no markdown code blocks.`

    const result = await model.generateContent(fullPrompt)
    let text = result.response.text()

    // Clean up potential markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(text) as GenerateElementsResponse
      return parsed
    } catch (error) {
      console.error('Failed to parse Gemini response:', text)
      throw new Error('Failed to parse map elements from AI response')
    }
  },
}
