import { create } from 'zustand';
import type { DriverRide } from '../types';
import { fetchActiveRides } from '../services/dataService';

interface MatchedRider {
  id: string;
  name: string;
  rating: number;
  pickupAddress: string;
  dropoffAddress: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'dropped_off';
}

export interface ActiveRide extends DriverRide {
  matchedRiders: MatchedRider[];
}

interface ActiveRidesStore {
  activeRides: ActiveRide[];
  setActiveRides: (rides: ActiveRide[]) => void;
  addRide: (ride: ActiveRide) => void;
  removeRide: (rideId: string) => void;
  updateRide: (rideId: string, updater: (ride: ActiveRide) => ActiveRide) => void;
  loadActiveRides: (userId: string) => Promise<void>;
}

export const useActiveRidesStore = create<ActiveRidesStore>((set) => ({
  activeRides: [],
  setActiveRides: (activeRides) => set({ activeRides }),
  addRide: (ride) => set((state) => ({ activeRides: [ride, ...state.activeRides] })),
  removeRide: (rideId) =>
    set((state) => ({ activeRides: state.activeRides.filter((r) => r.id !== rideId) })),
  updateRide: (rideId, updater) =>
    set((state) => ({
      activeRides: state.activeRides.map((r) => (r.id === rideId ? updater(r) : r)),
    })),
  loadActiveRides: async (userId: string) => {
    const rides = await fetchActiveRides(userId);
    set({ activeRides: rides });
  },
}));
