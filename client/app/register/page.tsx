'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Mail, Lock, User as UserIcon, CheckCircle, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '../../components/auth/BrandLogo';

type Step = 'form' | 'verify' | 'success';


export default function RegisterPage() {
    const [step, setStep] = useState<Step>('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { register, verifyOtp, resendOtp } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const lockedEmail = searchParams.get('email') || '';
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Pre-fill email from invite link
    useEffect(() => {
        if (lockedEmail) setEmail(lockedEmail);
    }, [lockedEmail]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'verify' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleResendOtp = async () => {
        if (!canResend) return;
        setIsLoading(true);
        setError('');
        try {
            await resendOtp(email);
            setTimer(60);
            setCanResend(false);
            setToastMessage('A new code has been sent to your email.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };


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

    const validatePassword = (pass: string) => {
        if (pass.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return false;
        }
        if (!/[A-Z]/.test(pass)) {
            setPasswordError('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
            setPasswordError('Password must contain at least one special character');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) return;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await register(name, email, password);
            setStep('verify');
        } catch (err: any) {
            if (err.message === 'Account exists but is not verified') {
                setToastMessage(err.message);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
                setStep('verify');
            } else {
                setError(err.message || 'Failed to create account. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await verifyOtp(email, otp.join(''), redirectTo);

        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check your code.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleOtpChange = (index: number, value: string) => {
        const char = value.slice(-1);

        // Restrict to numbers only
        if (char && !/^\d$/.test(char)) return;

        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        if (char && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        // Restrict to numbers only
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setOtp(newOtp);
        const lastIdx = Math.min(pastedData.length, 5);
        otpRefs.current[lastIdx]?.focus();
    };

    const isMatch = password === confirmPassword && password.length > 0;
    const canSubmitStore = name && email && password && confirmPassword && isMatch && !isLoading;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background noise p-6">
            <BrandLogo className="mb-10" />

            <div className="w-full max-w-md space-y-8 rounded-[2.5rem] bg-white p-10 sm:p-12 shadow-huge border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                <div className="text-center space-y-2">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                        {step === 'form' && 'Create Account'}
                        {step === 'verify' && 'Verify Identity'}
                        {step === 'success' && 'Welcome Aboard'}
                    </h2>
                    <p className="text-base text-secondary font-medium italic">
                        {step === 'form' && 'Join the collective and orchestrate your growth.'}
                        {step === 'verify' && `We've sent a code to your email.`}
                        {step === 'success' && 'Your account is ready for orchestration.'}
                    </p>
                </div>

                {error && (
                    <div className="animate-in fade-in slide-in-from-top-4 rounded-xl bg-danger/5 p-4 text-xs font-bold text-danger border border-danger/10 text-center shadow-sm">
                        {error}
                    </div>
                )}

                {step === 'form' && (
                    <form className="space-y-6" onSubmit={handleRegisterSubmit} noValidate>
                        <div className="space-y-4">
                            <div className="relative group transition-luxury">
                                <label htmlFor="name" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                    Name
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        className="block w-full rounded-xl border border-border bg-background py-4 pl-14 pr-5 text-base text-foreground placeholder-secondary/30 transition-luxury focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 font-medium shadow-sm hover:border-primary/30"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="relative group transition-luxury">
                                <label htmlFor="email" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
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
                                        id="email"
                                        type="text"
                                        required
                                        readOnly={!!lockedEmail}
                                        className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-5 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm ${lockedEmail ? 'cursor-not-allowed opacity-75 border-emerald-300' : emailError ? 'border-danger/30 focus:border-danger focus:ring-danger/5' : 'border-border focus:border-primary focus:ring-primary/5 hover:border-primary/30'}`}
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => {
                                            if (lockedEmail) return;
                                            setEmail(e.target.value);
                                            if (emailError) validateEmail(e.target.value);
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
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-12 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm ${passwordError ? 'border-danger/30 focus:border-danger focus:ring-danger/5' : 'border-border focus:border-primary focus:ring-primary/5 hover:border-primary/30'}`}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (passwordError) validatePassword(e.target.value);
                                        }}
                                        onBlur={(e) => validatePassword(e.target.value)}
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
                            </div>

                            <div className="relative group transition-luxury">
                                <label htmlFor="confirm-password" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                    <input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-12 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm hover:border-primary/30 ${confirmPassword && !isMatch
                                            ? 'border-danger/30 focus:border-danger focus:ring-danger/5'
                                            : 'border-border focus:border-primary focus:ring-primary/5'
                                            }`}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-primary transition-colors p-1"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {confirmPassword && !isMatch && (
                                    <p className="mt-1.5 ml-1 text-[10px] font-bold text-danger animate-in fade-in slide-in-from-top-1">
                                        Heads up: Passwords don&apos;t match yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmitStore}
                            className="btn-primary"
                        >

                            {isLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Get Started</span>
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        <div className="pt-2 text-center">
                            <p className="text-sm font-medium text-secondary">
                                Already have an account?{' '}
                                <Link href={`/login${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="font-bold text-primary hover:text-primary-dark underline-offset-4 hover:underline transition-colors ml-1">
                                    Sign in instead
                                </Link>
                            </p>
                        </div>
                    </form>
                )}

                {step === 'verify' && (
                    <form className="space-y-8" onSubmit={handleOtpSubmit}>
                        <div className="flex justify-between gap-2.5">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { otpRefs.current[idx] = el; }}
                                    type="text"
                                    maxLength={1}
                                    className="h-14 w-full rounded-xl border border-border bg-background text-center text-xl font-bold text-foreground transition-luxury focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-sm hover:border-primary/30"
                                    value={digit}
                                    onPaste={handleOtpPaste}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={otp.some(d => !d) || isLoading}
                            className="btn-primary"
                        >

                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Verify Authentication</span>
                                    <ShieldCheck className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center space-y-4">
                            {!canResend ? (
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                                    Resend code in <span className="text-primary">{timer}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest underline underline-offset-4"
                                >
                                    Resend Verification Code
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('form');
                                    setTimer(60);
                                    setCanResend(false);
                                }}
                                className="inline-flex items-center gap-2 text-[10px] font-bold text-secondary/60 hover:text-secondary transition-colors uppercase tracking-widest flex w-full justify-center"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Edit Account Details
                            </button>
                        </div>
                    </form>
                )}

                {step === 'success' && (
                    <div className="space-y-10 text-center py-4">
                        <div className="flex justify-center">
                            <div className="rounded-2xl bg-success/10 p-6 shadow-inner shadow-success/5 animate-bounce-slow">
                                <CheckCircle className="h-12 w-12 text-success" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="group relative flex w-full h-14 items-center justify-center gap-2.5 rounded-xl bg-primary-dark px-6 py-3 text-base font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:bg-primary hover:-translate-y-0.5 hover:shadow-primary/30 active:scale-95"
                            >
                                <span>Sign In Now</span>
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-full slide-out-to-right-full flex items-center gap-3 rounded-2xl bg-white p-4 pr-6 shadow-huge border border-primary/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">Verification Required</p>
                        <p className="text-[10px] font-medium text-secondary italic">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
