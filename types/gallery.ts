import { MapElement, ChatMessage, MapViewState } from './index'

export interface GalleryItem {
    id: string
    title: string
    description: string
    thumbnail?: string
    data: {
        elements?: MapElement[]
        messages?: ChatMessage[]
        viewState?: MapViewState
        // Fallback for old format where these might be at root
        [key: string]: any
    }
}
