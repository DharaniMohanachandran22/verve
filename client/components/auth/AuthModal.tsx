'use client';

import { useState, useRef, useEffect } from 'react';
import { X, LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User as UserIcon, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api-client';

type Mode = 'login' | 'register';
type RegStep = 'form' | 'verify';

interface AuthModalProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly defaultMode?: Mode;
}

export default function AuthModal({ onClose, onSuccess, defaultMode = 'register' }: AuthModalProps) {
  const { register, resendOtp, checkAuth } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [regStep, setRegStep] = useState<RegStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (regStep !== 'verify') return;
    setTimer(60);
    setCanResend(false);
  }, [regStep]);

  useEffect(() => {
    if (regStep !== 'verify') return;
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [regStep, timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password }) as any;
      if (res.success && res.data) {
        await checkAuth();
        onSuccess();
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      await register(name, email, password);
      setRegStep('verify');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit code'); return; }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code }) as any;
      if (res.success && res.data) {
        await checkAuth();
        onSuccess();
      } else {
        setError('Invalid code');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid code');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try { await resendOtp(email); setTimer(60); setCanResend(false); } catch (_) { /* ignore */ }
  };

  const switchMode = (next: Mode) => { setMode(next); setError(''); };

  const inputCls = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';
  const inputPrCls = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';
  const btnCls = 'flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-60 transition-all active:scale-95';
  const Spinner = () => <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 py-8 text-center">
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            {mode === 'login' ? <LogIn className="h-6 w-6 text-white" /> : <UserPlus className="h-6 w-6 text-white" />}
          </div>
          <h2 className="text-xl font-black text-white">
            {mode === 'login' ? 'Sign in to continue' : regStep === 'verify' ? 'Verify your email' : 'Create an account'}
          </h2>
          <p className="mt-1 text-xs text-emerald-100">to accept this board invitation</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputPrCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={isLoading} className={btnCls}>
                {isLoading ? <Spinner /> : <><LogIn className="h-4 w-4" /> Sign In</>}
              </button>
            </form>
          )}

          {mode === 'register' && regStep === 'form' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputPrCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input type={showConfirm ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={inputPrCls} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={isLoading} className={btnCls}>
                {isLoading ? <Spinner /> : <><UserPlus className="h-4 w-4" /> Create Account</>}
              </button>
            </form>
          )}

          {mode === 'register' && regStep === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-center text-sm text-zinc-500">
                We sent a 6-digit code to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>
              </p>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={`otp-${i}`} ref={(el) => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    aria-label={`OTP digit ${i + 1}`}
                    className="h-12 w-10 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-lg font-bold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                ))}
              </div>
              <button type="submit" disabled={isLoading} className={btnCls}>
                {isLoading ? <Spinner /> : <><CheckCircle className="h-4 w-4" /> Verify & Continue</>}
              </button>
              <p className="text-center text-xs text-zinc-400">
                {canResend
                  ? <button type="button" onClick={handleResend} className="text-emerald-500 font-bold hover:underline">Resend code</button>
                  : <>Resend in {timer}s</>}
              </p>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-zinc-400">
            {mode === 'login'
              ? <><span>No account? </span><button type="button" onClick={() => switchMode('register')} className="font-bold text-emerald-500 hover:underline">Create one</button></>
              : regStep === 'form'
                ? <><span>Already have an account? </span><button type="button" onClick={() => switchMode('login')} className="font-bold text-emerald-500 hover:underline">Sign in</button></>
                : null}
          </p>
        </div>
      </div>
    </div>
  );
}
