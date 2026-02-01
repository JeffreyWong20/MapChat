'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useMapStore } from '@/stores/mapStore'
import { useChatStore } from '@/stores/chatStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { Download, Upload, Trash2, Map, PlayCircle, Columns2, MessageSquare, LayoutGrid, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ExportDialog } from './ExportDialog'
import { SaveToGalleryDialog } from '@/components/gallery/SaveToGalleryDialog'
import { useState } from 'react'


export type ViewMode = 'split' | 'map' | 'chat' | 'gallery'

interface HeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function Header({ viewMode, onViewModeChange }: HeaderProps) {
  const { elements, setElements, clearElements, viewState, setViewState } = useMapStore()
  const { messages, setMessages, clearMessages } = useChatStore()
  const { reset: resetTimeline } = useTimelineStore()
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleExport = () => {
    setShowExportDialog(true)
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
        // Handle both flat structure and nested data property
        const elements = data.data?.elements || data.elements
        const messages = data.data?.messages || data.messages
        const viewState = data.data?.viewState || data.viewState

        if (elements) setElements(elements)
        if (messages) setMessages(messages)
        if (viewState) setViewState(viewState)
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
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            className="rounded-r-none border-0"
            onClick={() => onViewModeChange('map')}
          >
            <Map className="h-4 w-4 mr-2" />
            Map
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            className="rounded-none border-0 border-x"
            onClick={() => onViewModeChange('split')}
          >
            <Columns2 className="h-4 w-4 mr-2" />
            Split
          </Button>
          <Button
            variant={viewMode === 'chat' ? 'default' : 'outline'}
            size="sm"
            className="rounded-l-none border-0"
            onClick={() => onViewModeChange('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>

        <Button
          variant={viewMode === 'gallery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange(viewMode === 'gallery' ? 'split' : 'gallery')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Gallery
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
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
        <ThemeToggle />
      </div>

      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
      <SaveToGalleryDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} />
    </header>
  )
}
