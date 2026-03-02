import { create } from 'zustand';
import type { RecurringRide } from '../types';

interface RecurringRidesStore {
  rides: RecurringRide[];
  setRides: (rides: RecurringRide[]) => void;
  addRide: (ride: RecurringRide) => void;
  updateRide: (id: string, updates: Partial<RecurringRide>) => void;
  deleteRide: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useRecurringRidesStore = create<RecurringRidesStore>((set) => ({
  rides: [],
  setRides: (rides) => set({ rides }),
  addRide: (ride) => set((state) => ({ rides: [...state.rides, ride] })),
  updateRide: (id, updates) =>
    set((state) => ({
      rides: state.rides.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  deleteRide: (id) =>
    set((state) => ({ rides: state.rides.filter((r) => r.id !== id) })),
  toggleActive: (id) =>
    set((state) => ({
      rides: state.rides.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      ),
    })),
}));
