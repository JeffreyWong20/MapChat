'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { MapContainer } from '@/components/map'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { TimelineSlider } from '@/components/timeline'

export default function Home() {
  return (
    <AppLayout
      mapPanel={<MapContainer />}
      chatPanel={<ChatPanel />}
      timelinePanel={<TimelineSlider />}
    />
  )
}
