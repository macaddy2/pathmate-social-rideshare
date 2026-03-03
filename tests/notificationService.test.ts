import { describe, it, expect, beforeAll, vi } from 'vitest';
import { notificationService, getNotificationIcon, getNotificationColor } from '../services/notificationService';
import type { NotificationType } from '../types';

// Initialize the service with mock data before all tests
beforeAll(async () => {
    await notificationService.init('test-user');
});

describe('NotificationService', () => {
    it('should return mock notifications', () => {
        const notifications = notificationService.getNotifications();
        expect(notifications).toBeDefined();
        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return notifications sorted by date (newest first)', () => {
        const notifications = notificationService.getNotifications();
        for (let i = 0; i < notifications.length - 1; i++) {
            expect(notifications[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                notifications[i + 1].createdAt.getTime()
            );
        }
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

    it('should mark all as read', () => {
        notificationService.markAllAsRead();
        expect(notificationService.getUnreadCount()).toBe(0);
    });

    it('should add a new notification', () => {
        const initialCount = notificationService.getNotifications().length;
        notificationService.addNotification({
            userId: 'test-user',
            type: 'new_message',
            title: 'Test Notification',
            message: 'This is a test',
            read: false,
        });
        expect(notificationService.getNotifications().length).toBe(initialCount + 1);
    });

    it('should delete a notification', () => {
        const notifications = notificationService.getNotifications();
        const targetId = notifications[0].id;
        const initialCount = notifications.length;

        notificationService.deleteNotification(targetId);
        expect(notificationService.getNotifications().length).toBe(initialCount - 1);
        expect(notificationService.getNotifications().find(n => n.id === targetId)).toBeUndefined();
    });

    it('should support subscribe/unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = notificationService.subscribe(listener);

        // Trigger a change
        notificationService.addNotification({
            userId: 'test',
            type: 'ride_match',
            title: 'Test',
            message: 'Test',
            read: false,
        });

        expect(listener).toHaveBeenCalled();
        expect(Array.isArray(listener.mock.calls[0][0])).toBe(true);

        // Unsubscribe and verify no more calls
        unsubscribe();
        const callCount = listener.mock.calls.length;
        notificationService.markAllAsRead();
        expect(listener.mock.calls.length).toBe(callCount); // No new calls
    });

    it('should return correct icon for notification types', () => {
        expect(getNotificationIcon('ride_match')).toBe('🚗');
        expect(getNotificationIcon('payment_received')).toBe('💰');
        expect(getNotificationIcon('new_message')).toBe('💬');
        expect(getNotificationIcon('booking_confirmed')).toBe('✅');
        expect(getNotificationIcon('driver_arriving')).toBe('📍');
        expect(getNotificationIcon('ride_started')).toBe('🏁');
        expect(getNotificationIcon('ride_completed')).toBe('🎉');
        expect(getNotificationIcon('rating_received')).toBe('⭐');
    });

    it('should return correct color for notification types', () => {
        expect(getNotificationColor('ride_match')).toContain('blue');
        expect(getNotificationColor('payment_received')).toContain('amber');
        expect(getNotificationColor('booking_confirmed')).toContain('green');
        expect(getNotificationColor('driver_arriving')).toContain('purple');
        expect(getNotificationColor('ride_started')).toContain('indigo');
        expect(getNotificationColor('ride_completed')).toContain('emerald');
        expect(getNotificationColor('new_message')).toContain('pink');
        expect(getNotificationColor('rating_received')).toContain('yellow');
    });

    it('should return fallback for unknown notification type', () => {
        const icon = getNotificationIcon('unknown_type' as NotificationType);
        expect(icon).toBe('🔔');

        const color = getNotificationColor('unknown_type' as NotificationType);
        expect(color).toContain('gray');
    });
});
