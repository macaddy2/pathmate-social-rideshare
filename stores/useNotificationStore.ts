import { create } from 'zustand'
import { notificationService } from '../services/notificationService'

interface NotificationState {
  unreadCount: number
  refresh: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: notificationService.getUnreadCount(),
  refresh: () => {
    set({
      unreadCount: notificationService.getUnreadCount(),
    })
  },
}))
