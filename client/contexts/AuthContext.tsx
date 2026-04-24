'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api-client';

interface User {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isEmailVerified: boolean;
    login: (email: string, password: string, redirectTo?: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean }>;
    verifyOtp: (email: string, otp: string, redirectTo?: string) => Promise<void>;
    validateOtp: (email: string, otp: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, otp: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    resendOtp: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();

    const isProtectedPath = (path: string | null): boolean => {
        if (!path) return false;
        const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/boards/join'];
        if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return false;
        const PROTECTED_PATHS = ['/dashboard', '/boards', '/notifications'];
        return PROTECTED_PATHS.some((p) => path.startsWith(p));
    };

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me') as any;
            if (response.success && response.data) {
                setUser(response.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh access token using refresh token cookie
    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        try {
            const response = await api.post('/auth/refresh', {}) as any;
            if (response?.success && response?.data?.accessToken) {
                return true;
            }
            return false;
        } catch {
            setUser(null);
            return false;
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    // Redirect unauthenticated users away from protected pages
    useEffect(() => {
        if (isLoading) return;
        if (!user && isProtectedPath(pathname)) {
            router.replace('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading]);

    const login = async (email: string, password: string, redirectTo?: string) => {
        const response = await api.post('/auth/login', { email, password }) as any;
        if (response.success && response.data) {
            const { user: userData } = response.data;
            queryClient.clear();
            setUser(userData);
            router.push(redirectTo || '/dashboard');
        }
    };

    const register = async (name: string, email: string, password: string): Promise<{ needsVerification: boolean }> => {
        await api.post('/auth/register', { name, email, password });
        return { needsVerification: true };
    };

    const verifyOtp = async (email: string, otp: string, redirectTo?: string) => {
        const response = await api.post('/auth/verify-otp', { email, otp }) as any;
        if (response.success && response.data) {
            const { user: userData } = response.data;
            queryClient.clear();
            setUser(userData);
            router.push(redirectTo || '/dashboard');
        }
    };


    const forgotPassword = async (email: string) => {
        await api.post('/auth/forgot-password', { email });
    };

    const resetPassword = async (email: string, otp: string, password: string) => {
        await api.post('/auth/reset-password', { email, otp, password });
    };

    const validateOtp = async (email: string, otp: string) => {
        await api.post('/auth/validate-otp', { email, otp });
    };

    const resendOtp = async (email: string) => {
        await api.post('/auth/resend-otp', { email });
    };

    const logout = async () => {
        setIsLoggingOut(true);
        try {
            // Attempt to inform backend, but don't hang if it's slow
            await Promise.race([
                api.post('/auth/logout'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
            ]);
        } catch (error) {
            // Backend logout failed or timed out, proceed with local cleanup
        }

        try {
            queryClient.clear();
            setUser(null);

            // Explicitly clear any client-side cookies we might have access to (though tokens are httpOnly)
            if (typeof document !== 'undefined') {
                document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }

            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        } catch (err) {
            if (typeof window !== 'undefined') window.location.href = '/login';
        }
    };

    const contextValue = useMemo(
        () => ({
            user,
            isLoading,
            isEmailVerified: user?.isEmailVerified ?? false,
            login,
            register,
            verifyOtp,
            validateOtp,
            forgotPassword,
            resetPassword,
            logout,
            checkAuth,
            refreshAccessToken,
            resendOtp,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, isLoading],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {isLoggingOut && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-500 animate-in fade-in">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    </div>
                    <p className="mt-6 font-serif text-lg font-bold text-foreground animate-pulse">Safely signing you out...</p>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
