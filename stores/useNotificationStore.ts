import { create } from 'zustand'
import { notificationService } from '../services/notificationService'

interface NotificationState {
  unreadCount: number
  refresh: () => void
}

export const useNotificationStore = create<NotificationState>((set) => {
  // Auto-subscribe to notification service changes
  notificationService.subscribe(() => {
    set({ unreadCount: notificationService.getUnreadCount() })
  })

  return {
    unreadCount: notificationService.getUnreadCount(),
    refresh: () => {
      set({ unreadCount: notificationService.getUnreadCount() })
    },
  }
})
