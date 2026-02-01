'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { MapContainer } from '@/components/map'
import { ChatPanel } from '@/components/chat/ChatPanel'

export default function Home() {
  return (
    <AppLayout
      mapPanel={<MapContainer />}
      chatPanel={<ChatPanel />}
    />
  )
}
