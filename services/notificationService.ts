/**
 * Notification Service
 * Handles in-app notifications and provides hooks for notification management
 */

import type { UserNotification, NotificationType } from '../types';
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotificationById,
    createNotification as createNotificationInDb,
} from './dataService';

// ============================================
// NOTIFICATION SERVICE CLASS
// ============================================

class NotificationService {
    private notifications: UserNotification[] = [];
    private listeners: Set<(notifications: UserNotification[]) => void> = new Set();
    private initialized = false;

    constructor() {
        // Notifications are loaded lazily via init()
    }

    // Initialize with data from Supabase (or mock fallback)
    async init(userId: string): Promise<void> {
        if (this.initialized) return;
        this.notifications = await fetchNotifications(userId);
        this.initialized = true;
        this.notifyListeners();
    }

    // Get all notifications
    getNotifications(): UserNotification[] {
        return [...this.notifications].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
    }

    // Get unread count
    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    // Mark notification as read
    markAsRead(notificationId: string): void {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.notifyListeners();
            markNotificationRead(notificationId);
        }
    }

    // Mark all as read
    markAllAsRead(userId?: string): void {
        this.notifications.forEach(n => (n.read = true));
        this.notifyListeners();
        if (userId) markAllNotificationsRead(userId);
    }

    // Add a new notification
    addNotification(notification: Omit<UserNotification, 'id' | 'createdAt'>): void {
        const newNotification: UserNotification = {
            ...notification,
            id: `notif-${Date.now()}`,
            createdAt: new Date(),
        };
        this.notifications.unshift(newNotification);
        this.notifyListeners();
        createNotificationInDb(notification);

        // Show browser notification if permitted
        this.showBrowserNotification(newNotification);
    }

    // Delete notification
    deleteNotification(notificationId: string): void {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.notifyListeners();
        deleteNotificationById(notificationId);
    }

    // Subscribe to changes
    subscribe(listener: (notifications: UserNotification[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify all listeners
    private notifyListeners(): void {
        const notifications = this.getNotifications();
        this.listeners.forEach(listener => listener(notifications));
    }

    // Show browser notification
    private async showBrowserNotification(notification: UserNotification): Promise<void> {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: notification.id,
                });
            }
        }
    }

    // Request notification permission
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
}

// Singleton instance
export const notificationService = new NotificationService();

// ============================================
// NOTIFICATION ICON HELPER
// ============================================

export const getNotificationIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
        ride_match: '🚗',
        booking_confirmed: '✅',
        driver_arriving: '📍',
        ride_started: '🏁',
        ride_completed: '🎉',
        new_message: '💬',
        payment_received: '💰',
        rating_received: '⭐',
    };
    return icons[type] || '🔔';
};

// ============================================
// NOTIFICATION COLOR HELPER
// ============================================

export const getNotificationColor = (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
        ride_match: 'bg-blue-100 text-blue-600',
        booking_confirmed: 'bg-green-100 text-green-600',
        driver_arriving: 'bg-purple-100 text-purple-600',
        ride_started: 'bg-indigo-100 text-indigo-600',
        ride_completed: 'bg-emerald-100 text-emerald-600',
        new_message: 'bg-pink-100 text-pink-600',
        payment_received: 'bg-amber-100 text-amber-600',
        rating_received: 'bg-yellow-100 text-yellow-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
};
