/**
 * NotificationCenter Component
 * Displays in-app notifications with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { notificationService, getNotificationIcon, getNotificationColor } from '../services/notificationService';
import type { UserNotification } from '../types';

// ============================================
// NOTIFICATION ITEM COMPONENT
// ============================================

interface NotificationItemProps {
    notification: UserNotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, onDelete }) => {
    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 border-b border-gray-50 last:border-0 transition-colors ${!notification.read ? 'bg-indigo-50/50' : 'bg-white'
                }`}
            onClick={() => !notification.read && onRead(notification.id)}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
            </div>

            {!notification.read && (
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
            )}
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        // Initial load
        setNotifications(notificationService.getNotifications());

        // Subscribe to updates
        const unsubscribe = notificationService.subscribe(setNotifications);
        return unsubscribe;
    }, []);

    const handleRead = (id: string) => {
        notificationService.markAsRead(id);
    };

    const handleDelete = (id: string) => {
        notificationService.deleteNotification(id);
    };

    const handleMarkAllRead = () => {
        notificationService.markAllAsRead();
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl max-h-[80vh] flex flex-col animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-3 border-b border-gray-50">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-3">🔔</span>
                            <p className="font-medium">No notifications</p>
                            <p className="text-sm text-gray-400">
                                {filter === 'unread' ? "You're all caught up!" : "Check back later"}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={handleRead}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
