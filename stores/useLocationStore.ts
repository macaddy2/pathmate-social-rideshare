import { create } from 'zustand'

interface LocationState {
  userLocation: { lat: number; lng: number } | undefined
  setUserLocation: (location: { lat: number; lng: number }) => void
  initGeolocation: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  userLocation: undefined,
  setUserLocation: (location) => set({ userLocation: location }),
  initGeolocation: () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          })
        },
        (error) => console.warn('Geolocation denied:', error.message),
        { enableHighAccuracy: true }
      )
    }
  },
}))
