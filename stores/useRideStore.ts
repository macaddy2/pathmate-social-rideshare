import { create } from 'zustand'
import { UserRole } from '../types'
import type { Rating } from '../types'
import { fetchUserRatings } from '../services/dataService';

interface RideState {
  role: UserRole
  ratings: Rating[]
  setRole: (role: UserRole) => void
  addRating: (rating: Rating) => void
  getAverageRating: (userId: string, targetRole: 'RIDER' | 'DRIVER') => number
  loadRatings: (userId: string) => Promise<void>
}

export const useRideStore = create<RideState>((set, get) => ({
  role: UserRole.GUEST,
  ratings: [],
  setRole: (role) => set({ role }),
  addRating: (rating) => set((state) => ({ ratings: [...state.ratings, rating] })),
  getAverageRating: (userId, targetRole) => {
    const { ratings } = get()
    const relevant = ratings.filter((r) => r.toId === userId && r.role === targetRole)
    if (relevant.length === 0) return 5.0
    const sum = relevant.reduce((acc, curr) => acc + curr.score, 0)
    return Math.round((sum / relevant.length) * 10) / 10
  },
  loadRatings: async (userId: string) => {
    const ratings = await fetchUserRatings(userId);
    set({ ratings });
  },
}))
