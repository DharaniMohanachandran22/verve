'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '../../components/auth/BrandLogo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const lockedEmail = searchParams.get('email') || '';

    // Pre-fill email from invite link
    useEffect(() => {
        if (lockedEmail) setEmail(lockedEmail);
    }, [lockedEmail]);

    // Navigate to redirect target once user is set in context
    useEffect(() => {
        if (!authLoading && user) {
            router.replace(redirectTo);
        }
    }, [user, authLoading, router, redirectTo]);

    const validateEmail = (emailStr: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailStr) {
            setEmailError('Email is required');
            return false;
        }
        if (!regex.test(emailStr)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setEmailError('');
        setPasswordError('');

        const isEmailValid = validateEmail(email);
        if (!isEmailValid) return;

        if (!password) {
            setPasswordError('Password is required');
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password, redirectTo);
        } catch (err: any) {
            const msg = err.message || 'Invalid credentials. Please try again.';
            if (msg === 'Email does not exist') {
                setEmailError(msg);
            } else if (msg === 'Invalid or incorrect password') {
                setPasswordError(msg);
            } else if (msg.toLowerCase().includes('credential')) {
                setEmailError(msg);
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background noise p-6">
            <BrandLogo className="mb-10" />

            <div className="w-full max-w-md space-y-10 rounded-[2.5rem] bg-white p-10 sm:p-12 shadow-huge border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                <div className="text-center space-y-2">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                        Welcome Back
                    </h2>
                    <p className="text-base text-secondary font-medium italic">
                        Re-enter your digital sanctuary.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="animate-in fade-in slide-in-from-top-4 rounded-xl bg-danger/5 p-4 text-xs font-bold text-danger border border-danger/10 text-center shadow-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group transition-luxury">
                            <label htmlFor="email-address" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                Email
                            </label>
                            {lockedEmail && (
                                <p className="mb-1.5 ml-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                    Restricted to invited email
                                </p>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                <input
                                    id="email-address"
                                    name="email"
                                    type="text"
                                    autoComplete="email"
                                    required
                                    readOnly={!!lockedEmail}
                                    className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-5 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm ${lockedEmail ? 'cursor-not-allowed opacity-75 border-emerald-300' : emailError ? 'border-danger/30 focus:border-danger focus:ring-danger/5' : 'border-border focus:border-primary focus:ring-primary/5 hover:border-primary/30'}`}
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => {
                                        if (lockedEmail) return;
                                        setEmail(e.target.value);
                                        if (emailError) setEmailError('');
                                    }}
                                    onBlur={(e) => { if (!lockedEmail) validateEmail(e.target.value); }}
                                />
                            </div>
                            {emailError && (
                                <p className="mt-1.5 ml-1 text-[10px] font-bold text-danger animate-in fade-in slide-in-from-top-1">
                                    {emailError}
                                </p>
                            )}
                        </div>
                        <div className="relative group transition-luxury">
                            <label htmlFor="password" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-12 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm ${passwordError ? 'border-danger/30 focus:border-danger focus:ring-danger/5' : 'border-border focus:border-primary focus:ring-primary/5 hover:border-primary/30'}`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError('');
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-primary transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="mt-1.5 ml-1 text-[10px] font-bold text-danger animate-in fade-in slide-in-from-top-1">
                                    {passwordError}
                                </p>
                            )}
                            <div className="mt-2 text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest underline-offset-4 hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="btn-primary"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2.5">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                                <span>Authenticating...</span>
                            </div>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>


                    <div className="pt-2 text-center">
                        <p className="text-sm font-medium text-secondary">
                            New to the collective?{' '}
                            <Link href={`/register${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="font-bold text-primary hover:text-primary-dark underline-offset-4 hover:underline transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
