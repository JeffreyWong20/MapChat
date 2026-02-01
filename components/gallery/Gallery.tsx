'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/stores/mapStore'
import { useChatStore } from '@/stores/chatStore'
import { GalleryItem } from '@/types/gallery'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GalleryProps {
    onSelect: () => void
}

export function Gallery({ onSelect }: GalleryProps) {
    const [examples, setExamples] = useState<GalleryItem[]>([])
    const [loading, setLoading] = useState(true)
    const { setElements, setViewState } = useMapStore()
    const { setMessages } = useChatStore()

    useEffect(() => {
        const fetchExamples = async () => {
            try {
                const res = await fetch('/api/examples')
                if (!res.ok) throw new Error('Failed to fetch examples')
                const data = await res.json()
                setExamples(data.examples)
            } catch (error) {
                toast.error('Failed to load examples')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchExamples()
    }, [])

    const handleLoad = (item: GalleryItem) => {
        const { elements, messages, viewState } = item.data

        // Handle both flat structure (legacy/server loaded) and nested structure
        // The API might return the full object in 'data' prop as per my route.ts, 
        // but the type definition has data: { elements... }
        // Let's ensure we access safely.

        // In route.ts: data: data (which is the full JSON)
        // So item.data contains elements, messages, etc.

        const elementsToLoad = elements || (item.data as any).elements
        const messagesToLoad = messages || (item.data as any).messages
        const viewStateToLoad = viewState || (item.data as any).viewState

        if (elementsToLoad) setElements(elementsToLoad)
        if (messagesToLoad) setMessages(messagesToLoad)
        if (viewStateToLoad) setViewState(viewStateToLoad)

        toast.success(`Loaded "${item.title}"`)
        onSelect() // Switch view mode
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="p-4 h-full overflow-y-auto bg-background">
            <h2 className="text-2xl font-bold mb-4">Map Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examples.map((item) => (
                    <Card key={item.id} className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all" onClick={() => handleLoad(item)}>
                        <div className="aspect-video relative bg-muted flex items-center justify-center overflow-hidden">
                            {item.thumbnail ? (
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-muted-foreground text-sm">No Preview</div>
                            )}
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
                {examples.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No examples found in data/examples.
                    </div>
                )}
            </div>
        </div>
    )
}
