'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Layout, Bell, LogOut, ChevronDown } from 'lucide-react';
import api from '../../lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationDetail } from '../../lib/types/notification';
import NotificationList from '../notifications/NotificationList';
import { cn } from '../../lib/utils';
import BrandLogo from '../auth/BrandLogo';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [], refetch: refetchNotifs } = useQuery<NotificationDetail[]>({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications'),
        enabled: !!user,
        refetchInterval: 30000, // Poll every 30s
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (isUserOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
                setIsUserOpen(false);
            }
            if (isNotifOpen && notifMenuRef.current && !notifMenuRef.current.contains(target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifOpen, isUserOpen]);

    if (!user) return null;

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border glass px-6 lg:px-12">
            <div className="flex items-center gap-8">
                <BrandLogo size="small" />
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notifMenuRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative rounded-xl p-2.5 text-secondary transition-luxury hover:bg-primary/10 hover:text-primary active:scale-95"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:w-80 soft-shadow">
                            <div className="flex items-center justify-between border-b border-border p-5 bg-primary/5">
                                <h3 className="font-serif text-lg font-bold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllReadMutation.mutate()}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <NotificationList
                                    notifications={notifications}
                                    onUpdate={() => {
                                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                                    }}
                                />
                            </div>
                            <Link
                                href="/notifications"
                                onClick={() => setIsNotifOpen(false)}
                                className="block border-t border-border p-4 text-center text-[10px] font-bold text-secondary transition-colors hover:bg-primary/5 hover:text-primary uppercase tracking-widest"
                            >
                                View all
                            </Link>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setIsUserOpen(!isUserOpen)}
                        className="flex items-center gap-3 rounded-xl bg-primary/5 p-1.5 pr-4 transition-luxury hover:bg-primary/10 active:scale-95 border border-primary/5 hover:border-primary/20"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-white uppercase shadow-lg shadow-primary/20">
                            {user.name?.charAt(0) ?? '?'}
                        </div>
                        <span className="hidden text-xs font-bold sm:block text-foreground">
                            {user.name ?? ''}
                        </span>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-secondary transition-transform duration-500", isUserOpen && "rotate-180")} />
                    </button>

                    {isUserOpen && (
                        <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl soft-shadow">
                            <div className="border-b border-border p-5 bg-primary/5">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">Identified as</p>
                                <p className="mt-1.5 truncate text-xs font-bold text-foreground">{user.email}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        logout();
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold text-red-500 transition-luxury hover:bg-red-500/10 active:scale-[0.98]"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
