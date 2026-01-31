'use client'

import { Button } from '@/components/ui/button'
import { useMapStore } from '@/stores/mapStore'
import { useChatStore } from '@/stores/chatStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { Download, Upload, Trash2, Map } from 'lucide-react'
import { toast } from 'sonner'

export function Header() {
  const { elements, setElements, clearElements } = useMapStore()
  const { messages, setMessages, clearMessages } = useChatStore()
  const { reset: resetTimeline } = useTimelineStore()

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      elements,
      messages,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapchat-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Session exported successfully')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.elements) setElements(data.elements)
        if (data.messages) setMessages(data.messages)
        toast.success('Session imported successfully')
      } catch (error) {
        toast.error('Failed to import session')
      }
    }
    input.click()
  }

  const handleClear = () => {
    clearElements()
    clearMessages()
    resetTimeline()
    toast.success('Session cleared')
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-2">
        <Map className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">MapChat</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </header>
  )
}
