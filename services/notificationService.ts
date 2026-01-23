/**
 * Notification Service
 * Handles in-app notifications and provides hooks for notification management
 */

import { UserNotification, NotificationType } from '../types';

// ============================================
// MOCK NOTIFICATIONS (will be replaced with Supabase)
// ============================================

const generateMockNotifications = (): UserNotification[] => {
    const now = new Date();

    return [
        {
            id: 'notif-1',
            userId: 'current-user',
            type: 'ride_match' as NotificationType,
            title: 'New Ride Match!',
            message: 'Chidi is heading to your destination in 15 minutes',
            data: { rideId: 'ride-123' },
            read: false,
            createdAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
        },
        {
            id: 'notif-2',
            userId: 'current-user',
            type: 'booking_confirmed' as NotificationType,
            title: 'Booking Confirmed',
            message: 'Your ride with Adaeze is confirmed for 9:00 AM',
            data: { bookingId: 'booking-456' },
            read: false,
            createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
        },
        {
            id: 'notif-3',
            userId: 'current-user',
            type: 'driver_arriving' as NotificationType,
            title: 'Driver Arriving',
            message: 'Emmanuel is 3 minutes away',
            data: { bookingId: 'booking-789' },
            read: true,
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            id: 'notif-4',
            userId: 'current-user',
            type: 'payment_received' as NotificationType,
            title: 'Payment Received',
            message: 'You received ₦2,500 from Grace for your ride',
            data: { amount: 2500, currency: 'NGN' },
            read: true,
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
            id: 'notif-5',
            userId: 'current-user',
            type: 'rating_received' as NotificationType,
            title: 'New Rating',
            message: 'Fatima gave you a 5-star rating! ⭐',
            data: { rating: 5 },
            read: true,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
    ];
};

// ============================================
// NOTIFICATION SERVICE CLASS
// ============================================

class NotificationService {
    private notifications: UserNotification[] = [];
    private listeners: Set<(notifications: UserNotification[]) => void> = new Set();

    constructor() {
        this.notifications = generateMockNotifications();
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
        }
    }

    // Mark all as read
    markAllAsRead(): void {
        this.notifications.forEach(n => (n.read = true));
        this.notifyListeners();
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

        // Show browser notification if permitted
        this.showBrowserNotification(newNotification);
    }

    // Delete notification
    deleteNotification(notificationId: string): void {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.notifyListeners();
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
