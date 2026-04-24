'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    MessageSquare,
    UserPlus,
    ArrowRight,
    Clock,
    Mail,
    CheckCheck,
    Circle,
    Eye
} from 'lucide-react';
import { NotificationDetail, NotificationType } from '../../lib/types/notification';
import api from '../../lib/api-client';
import { cn } from '../../lib/utils';

interface Props {
    notifications: NotificationDetail[];
    onUpdate: () => void;
    className?: string;
}

export default function NotificationList({ notifications, onUpdate, className }: Props) {
    const router = useRouter();

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.patch(`/notifications/${id}/read`);
            onUpdate();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleClick = (notification: NotificationDetail) => {
        if (!notification.read) {
            api.patch(`/notifications/${notification.id}/read`).then(onUpdate);
        }

        // Logic to navigate based on entity
        if (notification.entityType === 'BOARD') {
            router.push(`/boards/${notification.entityId}`);
        } else if (notification.entityType === 'CARD') {
            // Boards handle deep linking if we have boardId in metadata
            const boardId = notification.metadata?.boardId;
            if (boardId) {
                router.push(`/boards/${boardId}?cardId=${notification.entityId}`);
            }
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.MENTION: return <MessageSquare className="h-4 w-4 text-emerald-500" />;
            case NotificationType.ASSIGNED: return <UserPlus className="h-4 w-4 text-green-500" />;
            case NotificationType.CARD_MOVED: return <ArrowRight className="h-4 w-4 text-zinc-500" />;
            case NotificationType.DUE_DATE_REMINDER: return <Clock className="h-4 w-4 text-orange-500" />;
            case NotificationType.BOARD_INVITATION: return <Mail className="h-4 w-4 text-purple-500" />;
            case NotificationType.CARD_UPDATED: return <Eye className="h-4 w-4 text-emerald-500" />;
            default: return <Bell className="h-4 w-4 text-zinc-500" />;
        }
    };

    const formatMessage = (notification: NotificationDetail) => {
        const { actorId, type, metadata } = notification;
        const actorName = typeof actorId === 'object' ? actorId.name : 'Someone';

        switch (type) {
            case NotificationType.MENTION:
                return <span><b>{actorName}</b> mentioned you in a comment</span>;
            case NotificationType.ASSIGNED:
                return <span><b>{actorName}</b> assigned you to a card</span>;
            case NotificationType.CARD_MOVED:
                return <span>Card <b>{metadata?.cardTitle}</b> was moved to <b>{metadata?.listName}</b></span>;
            case NotificationType.DUE_DATE_REMINDER:
                return <span>Card <b>{metadata?.cardTitle}</b> is due soon</span>;
            case NotificationType.BOARD_INVITATION:
                return <span><b>{actorName}</b> invited you to join board <b>{metadata?.boardTitle}</b></span>;
            case NotificationType.CARD_UPDATED:
                return (
                    <span>
                        <b>{actorName}</b> {metadata?.action} card <b>{metadata?.title}</b>
                        {metadata?.listName && <span> to <b>{metadata?.listName}</b></span>}
                        {metadata?.checklistTitle && <span> in checklist <b>{metadata?.checklistTitle}</b></span>}
                        {metadata?.itemName && <span>: <b>{metadata?.itemName}</b></span>}
                    </span>
                );
            default:
                return <span>New activity on board</span>;
        }
    };

    return (
        <div className={cn("space-y-1", className)}>
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                    <Bell className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">No notifications yet.</p>
                </div>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification.id}
                        onClick={() => handleClick(notification)}
                        className={cn(
                            "group relative flex cursor-pointer items-start gap-4 rounded-lg p-4 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            !notification.read && "bg-emerald-50/50 dark:bg-emerald-900/10"
                        )}
                    >
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 space-y-1 pr-8">
                            <p className="text-sm text-zinc-900 dark:text-zinc-200">
                                {formatMessage(notification)}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {new Date(notification.createdAt).toLocaleString()}
                            </p>
                        </div>

                        {!notification.read && (
                            <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white dark:hover:bg-zinc-700"
                                title="Mark as read"
                            >
                                <CheckCheck className="h-4 w-4 text-zinc-400" />
                            </button>
                        )}

                        {!notification.read && (
                            <Circle className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 fill-emerald-500 text-emerald-500 group-hover:hidden" />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
