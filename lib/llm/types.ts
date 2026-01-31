import type { MapElement } from '@/types'

export interface LLMProvider {
  chat(messages: LLMMessage[]): Promise<string>
  generateElements(prompt: string, context?: string): Promise<GenerateElementsResponse>
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GenerateElementsResponse {
  elements: MapElement[]
  summary: string
  suggestedViewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
}

export interface ChatRequest {
  messages: LLMMessage[]
}

export interface ChatResponse {
  content: string
}

