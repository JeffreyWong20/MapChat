'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMapStore } from '@/stores/mapStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { isDateInRange } from '@/lib/utils/dates'
import { MapLayers } from './MapLayers'
import { ElementPopup } from './ElementPopup'
import { AddPinDialog } from './AddPinDialog'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { viewState, setViewState, selectedElementId, setSelectedElement, elements, addElement } =
    useMapStore()
  const { startDate, endDate, isEnabled } = useTimelineStore()
  const [pendingPin, setPendingPin] = useState<null | {
    title: string
    description: string
    icon: string
    color: string
  }>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [rightClickLngLat, setRightClickLngLat] = useState<[number, number] | null>(null)

  // Auto-focus map on in-range elements when timeline changes (throttled)
  const lastFitRef = useRef(0)

  useEffect(() => {
    if (!isEnabled || !startDate || !endDate) return

    const doFit = () => {
      lastFitRef.current = Date.now()
      if (!mapRef.current) return

      const inRange = elements.filter((el) => {
        if (!el.visible || !el.timeRange?.start) return false
        return isDateInRange(el.timeRange.start, startDate, endDate)
      })

      if (inRange.length === 0) return

      let minLng = Infinity
      let maxLng = -Infinity
      let minLat = Infinity
      let maxLat = -Infinity

      const extend = (lng: number, lat: number) => {
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      }

      for (const el of inRange) {
        switch (el.type) {
          case 'pin':
            extend(el.coordinates[0], el.coordinates[1])
            break
          case 'area':
            el.coordinates[0]?.forEach((c) => extend(c[0], c[1]))
            break
          case 'route':
          case 'line':
            el.coordinates.forEach((c) => extend(c[0], c[1]))
            break
          case 'arc':
            extend(el.source[0], el.source[1])
            extend(el.target[0], el.target[1])
            break
        }
      }

      if (minLng === Infinity) return

      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 300 },
      )
    }

    const elapsed = Date.now() - lastFitRef.current
    if (elapsed >= 300) {
      doFit()
      return
    }

    const timer = setTimeout(doFit, 300 - elapsed)
    return () => clearTimeout(timer)
  }, [startDate, endDate, isEnabled, elements])

  const handleMove = useCallback(
    (evt: { viewState: typeof viewState }) => {
      setViewState(evt.viewState)
    },
    [setViewState],
  )

  const handleClick = useCallback(
    (evt: maplibregl.MapLayerMouseEvent) => {
      if (pendingPin) {
        // Place pin at clicked location
        const lngLat = evt.lngLat
        addElement({
          id: `pin_${Date.now()}`,
          type: 'pin',
          title: pendingPin.title,
          description: pendingPin.description,
          icon: pendingPin.icon,
          color: pendingPin.color,
          coordinates: [lngLat.lng, lngLat.lat],
          visible: true,
          createdBy: 'user',
        })
        setPendingPin(null)
        setRightClickLngLat(null)
        return
      }
      // Check if clicked on a feature
      const features = evt.features
      if (features && features.length > 0) {
        const feature = features[0]
        if (feature.properties?.id) {
          setSelectedElement(feature.properties.id)
          return
        }
      }
      // Clicked on empty space
      setSelectedElement(null)
    },
    [setSelectedElement, pendingPin, addElement],
  )

  // Right-click handler
  const handleContextMenu = useCallback((evt: maplibregl.MapLayerMouseEvent) => {
    evt.originalEvent.preventDefault()
    setShowPinDialog(true)
    setRightClickLngLat([evt.lngLat.lng, evt.lngLat.lat])
  }, [])

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10">
        <AddPinDialog
          onAdd={(data) => {
            if (rightClickLngLat) {
              // Add pin directly at right-click location
              addElement({
                id: `pin_${Date.now()}`,
                type: 'pin',
                title: data.title,
                description: data.description,
                icon: data.icon,
                color: data.color,
                coordinates: rightClickLngLat,
                visible: true,
                createdBy: 'user',
              })
              setShowPinDialog(false)
              setRightClickLngLat(null)
            } else {
              setPendingPin(data)
            }
          }}
          open={showPinDialog}
          setOpen={setShowPinDialog}
        />
        {pendingPin && (
          <div className="mt-2 p-2 bg-white border rounded shadow text-sm">
            Click on the map to place your pin.
          </div>
        )}
      </div>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ width: '100%', height: '100%' }}
        mapStyle={OPENFREEMAP_STYLE}
        interactiveLayerIds={['areas-layer', 'routes-layer', 'lines-layer', 'arcs-layer']}
      >
        <NavigationControl position="top-left" />
        <MapLayers />
        {selectedElementId && <ElementPopup />}
      </Map>
    </div>
  )
}
