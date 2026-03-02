import { create } from 'zustand';
import type { GeoPoint } from '../types';

interface SearchState {
  pickupAddress: string;
  pickupLocation: GeoPoint | null;
  dropoffAddress: string;
  dropoffLocation: GeoPoint | null;
}

interface SearchStore {
  search: SearchState;
  setSearch: (search: SearchState) => void;
  updateField: (field: keyof SearchState, value: string | GeoPoint | null) => void;
  clearSearch: () => void;
}

const initialSearch: SearchState = {
  pickupAddress: '',
  pickupLocation: null,
  dropoffAddress: '',
  dropoffLocation: null,
};

export const useSearchStore = create<SearchStore>((set) => ({
  search: initialSearch,
  setSearch: (search) => set({ search }),
  updateField: (field, value) =>
    set((state) => ({ search: { ...state.search, [field]: value } })),
  clearSearch: () => set({ search: initialSearch }),
}));
