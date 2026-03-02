import { create } from 'zustand'

interface ChatState {
  activeChat: { targetName: string; targetId: string } | null
  openChat: (targetName: string, targetId: string) => void
  closeChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  openChat: (targetName, targetId) => set({ activeChat: { targetName, targetId } }),
  closeChat: () => set({ activeChat: null }),
}))
