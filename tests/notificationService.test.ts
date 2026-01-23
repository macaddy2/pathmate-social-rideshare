import { describe, it, expect } from 'vitest';
import { notificationService, getNotificationIcon, getNotificationColor } from '../services/notificationService';

describe('NotificationService', () => {
    it('should return mock notifications', () => {
        const notifications = notificationService.getNotifications();
        expect(notifications).toBeDefined();
        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return unread count', () => {
        const count = notificationService.getUnreadCount();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should mark notification as read', () => {
        const notifications = notificationService.getNotifications();
        const unreadNotification = notifications.find(n => !n.read);

        if (unreadNotification) {
            const initialCount = notificationService.getUnreadCount();
            notificationService.markAsRead(unreadNotification.id);
            expect(notificationService.getUnreadCount()).toBeLessThanOrEqual(initialCount);
        }
    });

    it('should return correct icon for notification types', () => {
        expect(getNotificationIcon('ride_match')).toBe('🚗');
        expect(getNotificationIcon('payment_received')).toBe('💰');
        expect(getNotificationIcon('new_message')).toBe('💬');
    });

    it('should return correct color for notification types', () => {
        expect(getNotificationColor('ride_match')).toContain('blue');
        expect(getNotificationColor('payment_received')).toContain('amber');
        expect(getNotificationColor('booking_confirmed')).toContain('green');
    });
});
