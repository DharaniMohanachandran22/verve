'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../../components/auth/BrandLogo';

type Step = 'email' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { forgotPassword: requestOtp, resetPassword, validateOtp } = useAuth();
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'otp' && timer > 0) {
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
            await requestOtp(email);
            setTimer(60);
            setCanResend(false);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await requestOtp(email);
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send security code. Please check your email.');
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

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await validateOtp(email, otp.join(''));
            setStep('reset');
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check your code.');
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (pass: string) => {
        if (pass.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        if (!/[A-Z]/.test(pass)) {
            setPasswordError('Include at least one uppercase letter');
            return false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
            setPasswordError('Include at least one special character');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (!validatePassword(password)) return;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await resetPassword(email, otp.join(''), password);
            setStep('success');
        } catch (err: any) {
            const msg = err.message || 'Reset failed. Your code may be invalid or expired.';
            if (msg.includes('same as the old password')) {
                setPasswordError(msg);
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

            <div className="w-full max-w-md space-y-8 rounded-[2.5rem] bg-white p-10 sm:p-12 shadow-huge border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                <div className="text-center space-y-2">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                        {step === 'email' && 'Reset Password'}
                        {step === 'otp' && 'Verify Identity'}
                        {step === 'reset' && 'New Secure Key'}
                        {step === 'success' && 'Ready to Return'}
                    </h2>
                    <p className="text-base text-secondary font-medium italic">
                        {step === 'email' && 'We\'ll help you orchestrate your return.'}
                        {step === 'otp' && 'A secure code was sent to your email.'}
                        {step === 'reset' && 'Define a new master key for your identity.'}
                        {step === 'success' && 'Your journey is ready to continue.'}
                    </p>
                </div>

                {error && (
                    <div className="animate-in fade-in slide-in-from-top-4 rounded-xl bg-danger/5 p-4 text-xs font-bold text-danger border border-danger/10 text-center shadow-sm">
                        {error}
                    </div>
                )}

                {step === 'email' && (
                    <form className="space-y-6" onSubmit={handleEmailSubmit} noValidate>
                        <div className="relative group transition-luxury">
                            <label htmlFor="email" className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                Professional Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-xl border border-border bg-background py-4 pl-14 pr-5 text-base text-foreground placeholder-secondary/30 transition-luxury focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 font-medium shadow-sm hover:border-primary/30"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!email || isLoading}
                            className="group relative flex w-full h-14 items-center justify-center gap-2.5 rounded-xl bg-primary-dark px-6 py-3 text-base font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:bg-primary hover:-translate-y-0.5 hover:shadow-primary/30 disabled:opacity-50 disabled:bg-primary-dark/20 disabled:text-primary-dark/40 disabled:shadow-none disabled:translate-y-0 active:scale-95"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Send Security Code</span>
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Identification
                            </Link>
                        </div>
                    </form>
                )}

                {step === 'otp' && (
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
                            className="group relative flex w-full h-14 items-center justify-center gap-2.5 rounded-xl bg-primary-dark px-6 py-3 text-base font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:bg-primary hover:-translate-y-0.5 hover:shadow-primary/30 disabled:opacity-50 disabled:bg-primary-dark/20 disabled:text-primary-dark/40 disabled:shadow-none disabled:translate-y-0 active:scale-95"
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
                                    Resend Security Code
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('email');
                                    setTimer(60);
                                    setCanResend(false);
                                }}
                                className="inline-flex items-center gap-2 text-[10px] font-bold text-secondary/60 hover:text-secondary transition-colors uppercase tracking-widest flex w-full justify-center"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Re-enter Email
                            </button>
                        </div>
                    </form>
                )}

                {step === 'reset' && (
                    <form className="space-y-6" onSubmit={handleResetSubmit}>
                        <div className="space-y-4">
                            <div className="relative group transition-luxury">
                                <label className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-12 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm ${passwordError
                                            ? 'border-danger/30 focus:border-danger focus:ring-danger/5'
                                            : 'border-border focus:border-primary focus:ring-primary/5 hover:border-primary/30'
                                            }`}
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
                            </div>
                            <div className="relative group transition-luxury">
                                <label className="ml-1 mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary group-focus-within:text-primary transition-colors">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40 transition-colors group-focus-within:text-primary" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className={`block w-full rounded-xl border bg-background py-4 pl-14 pr-12 text-base text-foreground placeholder-secondary/30 transition-luxury focus:outline-none focus:ring-4 font-medium shadow-sm hover:border-primary/30 ${confirmPassword && password !== confirmPassword
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
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1.5 ml-1 text-[10px] font-bold text-danger animate-in fade-in slide-in-from-top-1">
                                        Heads up: Passwords don&apos;t match yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!password || password !== confirmPassword || isLoading}
                            className="group relative flex w-full h-14 items-center justify-center gap-2.5 rounded-xl bg-primary-dark px-6 py-3 text-base font-bold text-white shadow-xl shadow-primary/20 transition-luxury hover:bg-primary hover:-translate-y-0.5 hover:shadow-primary/30 disabled:opacity-50 disabled:bg-primary-dark/20 disabled:text-primary-dark/40 disabled:shadow-none disabled:translate-y-0 active:scale-95"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <span>Reset Master Key</span>
                            )}
                        </button>
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
                                <span>Return to SignIn</span>
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
