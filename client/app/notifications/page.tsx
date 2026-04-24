'use client';

import React from 'react';
import Navbar from '../../components/layout/Navbar';
import NotificationList from '../../components/notifications/NotificationList';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api-client';
import { NotificationDetail } from '../../lib/types/notification';
import { CheckCheck, Bell } from 'lucide-react';

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery<NotificationDetail[]>({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications'),
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
                            <p className="text-sm text-zinc-500">You have {unreadCount} unread notifications</p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 shadow-sm transition-all hover:bg-zinc-50 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-zinc-800"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <NotificationList
                            notifications={notifications}
                            onUpdate={() => {
                                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
