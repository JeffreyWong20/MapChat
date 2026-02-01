'use client'

import { ReactNode, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Header, type ViewMode } from './Header'
import { TimelineSlider } from '@/components/timeline'
import { Gallery } from '@/components/gallery/Gallery'

interface AppLayoutProps {
  mapPanel: ReactNode
  chatPanel: ReactNode
}

export function AppLayout({ mapPanel, chatPanel }: AppLayoutProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')

  return (
    <div className="flex flex-col h-screen">
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {(viewMode === 'split' || viewMode === 'gallery') && (
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full relative">
                {mapPanel}
                <TimelineSlider />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25}>
              {viewMode === 'gallery' ? (
                <Gallery onSelect={() => setViewMode('split')} />
              ) : (
                chatPanel
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {viewMode === 'map' && (
          <div className="flex-1 relative">
            {mapPanel}
            <TimelineSlider />
          </div>
        )}
        {viewMode === 'chat' && <div className="flex-1">{chatPanel}</div>}
      </div>
    </div>
  )
}
