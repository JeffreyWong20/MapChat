'use client'

import { useMemo, useState } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import { useMapStore } from '@/stores/mapStore'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { X, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { PinElement, ArcElement, AreaElement, RouteElement, LineElement } from '@/types'

function getElementCoordinates(
  element: PinElement | AreaElement | RouteElement | LineElement | ArcElement,
): [number, number] {
  switch (element.type) {
    case 'pin':
      return element.coordinates
    case 'arc':
      // Return midpoint of arc
      return [
        (element.source[0] + element.target[0]) / 2,
        (element.source[1] + element.target[1]) / 2,
      ]
    case 'area':
      // Return centroid of first ring
      const ring = element.coordinates[0]
      const sumLng = ring.reduce((acc, coord) => acc + coord[0], 0)
      const sumLat = ring.reduce((acc, coord) => acc + coord[1], 0)
      return [sumLng / ring.length, sumLat / ring.length]
    case 'route':
    case 'line':
      // Return midpoint of line
      const midIndex = Math.floor(element.coordinates.length / 2)
      return element.coordinates[midIndex]
    default:
      return [0, 0]
  }
}

export function ElementPopup() {
  const { elements, selectedElementId, setSelectedElement, removeElement, updateElement } =
    useMapStore()

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId),
    [elements, selectedElementId],
  )

  if (!selectedElement) return null

  const coordinates = getElementCoordinates(selectedElement)

  // Editable state for pins
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState(
    selectedElement.type === 'pin' ? selectedElement.title : '',
  )
  const [editDescription, setEditDescription] = useState(
    selectedElement.type === 'pin' ? selectedElement.description : '',
  )
  const [editIcon, setEditIcon] = useState(
    selectedElement.type === 'pin' ? selectedElement.icon || '📍' : '',
  )
  const [editColor, setEditColor] = useState(
    selectedElement.type === 'pin' ? selectedElement.color || '#FF6B6B' : '',
  )

  const handleSave = () => {
    updateElement(selectedElement.id, {
      title: editTitle,
      description: editDescription,
      icon: editIcon,
      color: editColor,
    })
    setEditMode(false)
  }

  return (
    <Popup
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      anchor="bottom"
      onClose={() => setSelectedElement(null)}
      closeButton={false}
      maxWidth="400px"
      className="map-popup"
    >
      <div className="bg-background rounded-lg shadow-lg border max-w-sm">
        <div className="flex items-start justify-between p-3 border-b">
          {selectedElement.type === 'pin' && editMode ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-semibold text-lg pr-2"
              maxLength={40}
            />
          ) : (
            <h3 className="font-semibold text-lg pr-2">{selectedElement.title}</h3>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setSelectedElement(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-64">
          <div className="p-3 space-y-3">
            {selectedElement.type === 'pin' && editMode ? (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div>
                    <label className="block text-xs font-medium mb-1">Emoji</label>
                    <Input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      maxLength={2}
                      style={{ width: 48 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color</label>
                    <Input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      style={{ width: 48, padding: 0 }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="default" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{selectedElement.description}</p>
                {selectedElement.type === 'pin' && (
                  <div className="flex gap-2 items-center">
                    <span className="text-2xl" title="Emoji">
                      {selectedElement.icon || '📍'}
                    </span>
                    <span
                      className="w-5 h-5 rounded-full border inline-block"
                      style={{ background: selectedElement.color || '#FF6B6B' }}
                      title="Color"
                    />
                  </div>
                )}
              </>
            )}

            {selectedElement.article && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{selectedElement.article.title}</h4>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{selectedElement.article.content}</ReactMarkdown>
                </div>
                {selectedElement.article.sources && selectedElement.article.sources.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedElement.article.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {new URL(source).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedElement.timeRange && (
              <div className="text-xs text-muted-foreground">
                <span>Date: {selectedElement.timeRange.start}</span>
                {selectedElement.timeRange.end && <span> - {selectedElement.timeRange.end}</span>}
              </div>
            )}

            {/* Edit/Delete buttons for pins */}
            {selectedElement.type === 'pin' && !editMode && (
              <div className="pt-2 border-t flex justify-end gap-2">
                {selectedElement.createdBy === 'user' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditTitle(selectedElement.title)
                      setEditDescription(selectedElement.description)
                      setEditIcon(selectedElement.icon || '📍')
                      setEditColor(selectedElement.color || '#FF6B6B')
                      setEditMode(true)
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    removeElement(selectedElement.id)
                    setSelectedElement(null)
                  }}
                >
                  Delete Pin
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Popup>
  )
}
