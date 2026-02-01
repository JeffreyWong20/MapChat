import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MapElement, MapViewState } from '@/types'

interface MapState {
  elements: MapElement[]
  selectedElementId: string | null
  viewState: MapViewState
  requestScreenshot: boolean
  screenshotResult: string | null

  // History
  past: MapElement[][]
  future: MapElement[][]
  undo: () => void
  redo: () => void

  // Actions
  addElement: (element: MapElement) => void
  addElements: (elements: MapElement[]) => void
  updateElement: (id: string, updates: Partial<MapElement>) => void
  removeElement: (id: string) => void
  clearElements: () => void
  setSelectedElement: (id: string | null) => void
  setViewState: (viewState: Partial<MapViewState>) => void
  setElements: (elements: MapElement[]) => void
  setRequestScreenshot: (request: boolean) => void
  setScreenshotResult: (result: string | null) => void
}

const defaultViewState: MapViewState = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 10,
  pitch: 0,
  bearing: 0,
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      elements: [],
      selectedElementId: null,
      viewState: defaultViewState,
      requestScreenshot: false,
      screenshotResult: null,

      // History state
      past: [],
      future: [],

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state

          const previous = state.past[state.past.length - 1]
          const newPast = state.past.slice(0, -1)

          return {
            past: newPast,
            future: [state.elements, ...state.future],
            elements: previous,
          }
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state

          const next = state.future[0]
          const newFuture = state.future.slice(1)

          return {
            past: [...state.past, state.elements],
            future: newFuture,
            elements: next,
          }
        }),

      addElement: (element) =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements: [...state.elements, element],
        })),

      addElements: (elements) =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements: [...state.elements, ...elements],
        })),

      updateElement: (id, updates) =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements: state.elements.map((el) =>
            el.id === id ? ({ ...el, ...updates } as MapElement) : el,
          ),
        })),

      removeElement: (id) =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        })),

      clearElements: () =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements: [],
          selectedElementId: null,
        })),

      setSelectedElement: (id) =>
        set({
          selectedElementId: id,
        }),

      setViewState: (viewState) =>
        set((state) => ({
          viewState: { ...state.viewState, ...viewState },
        })),

      setElements: (elements) =>
        set((state) => ({
          past: [...state.past, state.elements],
          future: [],
          elements,
          selectedElementId: null,
        })),

      setRequestScreenshot: (request) =>
        set({ requestScreenshot: request }),

      setScreenshotResult: (result) =>
        set({ screenshotResult: result }),
    }),
    {
      name: 'mapchat-map-store',
      partialize: (state) => ({
        elements: state.elements,
        selectedElementId: state.selectedElementId,
        viewState: state.viewState
        // Don't persist history
      }),
    },
  ),
)
