'use client'

import { ReactNode } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Header } from './Header'

interface AppLayoutProps {
  mapPanel: ReactNode
  chatPanel: ReactNode
  timelinePanel: ReactNode
}

export function AppLayout({ mapPanel, chatPanel, timelinePanel }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex-1 relative">{mapPanel}</div>
              <div className="border-t">{timelinePanel}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={25}>
            {chatPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
