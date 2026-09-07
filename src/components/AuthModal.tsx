import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Tag,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { api, setStoredToken } from '../lib/api.ts';
import { MTNMoMoAppIcon, AirtelMoneyAppIcon } from './BrandAssets.tsx';
import {
  registerWithFirebaseEmail,
  loginWithFirebaseEmail,
  syncUserRealtimeRecord,
  syncUserFirestoreRecord
} from '../lib/firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: any, wallet: any) => void;
  defaultMode?: 'login' | 'register';
  initialReferralCode?: string;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  defaultMode = 'register',
  initialReferralCode = '',
  onClose
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register Fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+256 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  const [referralVerification, setReferralVerification] = useState<{
    valid?: boolean;
    referrerUsername?: string;
    referrerName?: string;
    message?: string;
  } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Capture URL referral param & auto-fill from pendingReferralCode
  useEffect(() => {
    let candidate = initialReferralCode ? initialReferralCode.trim().toUpperCase() : '';
    
    // Check URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referralCode');
      if (urlRef) {
        candidate = urlRef.trim().toUpperCase();
        localStorage.setItem('pendingReferralCode', candidate);
      }
    } catch (e) {}

    // Check localStorage fallback
    if (!candidate) {
      try {
        const stored = localStorage.getItem('pendingReferralCode');
        if (stored) {
          candidate = stored.trim().toUpperCase();
        }
      } catch (e) {}
    }

    if (candidate) {
      setReferralCode(candidate);
      setIsReferralLocked(true);

      api.validateReferralCode(candidate)
        .then((res) => {
          if (res?.valid) setReferralVerification(res);
          else setReferralVerification(null);
        })
        .catch(() => {});
    }
  }, [initialReferralCode, isOpen]);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please choose a username');
      return;
    }
    if (!phone || phone.trim().length < 9) {
      setErrorMessage('Please enter your mobile phone number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName: username.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        referralCode: referralCode.trim() || undefined,
        termsAccepted
      });

      // Firebase Auth email registration
      try {
        await registerWithFirebaseEmail(email.trim(), password, username.trim());
      } catch (fbErr: any) {
        try {
          await loginWithFirebaseEmail(email.trim(), password);
        } catch (e) {}
      }

      // Clear pending referral code on success
      try {
        localStorage.removeItem('pendingReferralCode');
      } catch (e) {}

      try {
        await syncUserRealtimeRecord(res.user, res.wallet);
      } catch (e) {}
      try {
        await syncUserFirestoreRecord(res.user, res.wallet);
      } catch (e) {}

      setStoredToken(res.token);
      onSuccess(res.user, res.wallet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email, username, or phone number');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });

      if (loginIdentifier.includes('@')) {
        try {
          await loginWithFirebaseEmail(loginIdentifier.trim(), loginPassword);
        } catch (fbErr: any) {
          try {
            await registerWithFirebaseEmail(loginIdentifier.trim(), loginPassword, res.user.fullName || res.user.username);
          } catch (e) {}
        }
      }

      await syncUserRealtimeRecord(res.user, res.wallet);

      setStoredToken(res.token);
      onSuccess(res.user, res.wallet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="pesa-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-[430px] rounded-[36px] shadow-2xl overflow-hidden border border-white/40 bg-white relative my-auto"
      >
        {/* Sky-Blue Backdrop with 3D Fluffy Clouds Header matching reference screenshot */}
        <div className="relative bg-gradient-to-b from-[#87c4fa] via-[#aedbfd] to-[#d9eeff] pt-6 pb-6 px-6 overflow-hidden">
          {/* Top Back Icon Button matching circular pill `<` in screenshot */}
          <div className="flex items-center justify-between relative z-20 mb-2">
            {onClose ? (
              <button
                id="auth-back-btn"
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-sm border border-white/80 flex items-center justify-center text-slate-700 transition-all active:scale-90"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9" />
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/90 text-[11px] font-extrabold text-blue-900 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PESA CASH UG</span>
            </div>
          </div>

          {/* 3D Fluffy White Clouds SVG matching reference screenshot */}
          <div className="relative z-10 my-1 flex justify-center pointer-events-none">
            <svg
              className="w-48 h-20 drop-shadow-[0_8px_14px_rgba(255,255,255,0.8)] filter"
              viewBox="0 0 200 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cloudGrad" x1="100" y1="0" x2="100" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f3f8fd" />
                  <stop offset="100%" stopColor="#dbeafe" />
                </linearGradient>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Cloud base & soft puffs */}
              <ellipse cx="65" cy="50" rx="35" ry="24" fill="url(#cloudGrad)" />
              <ellipse cx="105" cy="38" rx="42" ry="32" fill="url(#cloudGrad)" />
              <ellipse cx="145" cy="48" rx="36" ry="25" fill="url(#cloudGrad)" />
              <ellipse cx="100" cy="55" rx="75" ry="20" fill="url(#cloudGrad)" />
              {/* Soft highlight rims */}
              <circle cx="95" cy="26" r="14" fill="#ffffff" opacity="0.6" />
              <circle cx="135" cy="36" r="10" fill="#ffffff" opacity="0.5" />
            </svg>
          </div>

          {/* Title and Subtitle matching screenshot */}
          <div className="text-left relative z-20 mt-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 font-medium mt-1">
              {mode === 'register'
                ? 'Join Pesa Cash and take the window seat'
                : 'Sign in to access your earnings and agency wallet'}
            </p>
          </div>
        </div>

        {/* White Form Sheet with Top Pill Handle */}
        <div className="bg-white px-6 pb-6 pt-2 relative z-20 -mt-2 rounded-t-[28px] shadow-sm">
          {/* Subtle Top Grab Handle matching screenshot */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= REGISTER MODE ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Starter Bonus Banner */}
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎁</span>
                  <div>
                    <p className="text-xs font-bold text-amber-950">UGX 1,000 Welcome Bonus</p>
                    <p className="text-[10px] text-amber-800">Credited instantly to your account</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300/80 shrink-0">
                  Free
                </span>
              </div>

              {/* 1. Username */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="register-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
              </div>

              {/* 2. Mobile Number (Requested: "users must add their mobile number") */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="register-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile number (+256 7...)"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
                <div className="flex items-center gap-1 shrink-0 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <MTNMoMoAppIcon className="w-4 h-4" />
                  <AirtelMoneyAppIcon className="w-4 h-4" />
                </div>
              </div>

              {/* 3. Email address */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="register-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
              </div>

              {/* 4. Password (Weak passwords explicitly allowed) */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 5. Confirm password */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="register-confirmpassword-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Referral Code Field with Auto-fill, ReadOnly Lock, & Clear/Edit Option */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Referral Code</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isReferralLocked ? '(Auto-filled)' : '(Optional)'}
                    </span>
                  </label>

                  {referralCode && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isReferralLocked) {
                          setIsReferralLocked(false);
                        } else {
                          setReferralCode('');
                          setReferralVerification(null);
                          try {
                            localStorage.removeItem('pendingReferralCode');
                          } catch (e) {}
                        }
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {isReferralLocked ? 'Change / Clear' : 'Clear'}
                    </button>
                  )}
                </div>

                <div
                  className={`relative rounded-2xl border transition-all px-3.5 py-2.5 flex items-center gap-2.5 ${
                    isReferralLocked
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100'
                  }`}
                >
                  <Tag className={`w-4 h-4 shrink-0 ${isReferralLocked ? 'text-blue-600' : 'text-slate-400'}`} />
                  <input
                    id="register-referral-input"
                    type="text"
                    readOnly={isReferralLocked}
                    value={referralCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().trim();
                      setReferralCode(val);
                      if (val.length >= 4) {
                        api.validateReferralCode(val)
                          .then((res) => {
                            if (res?.valid) setReferralVerification(res);
                            else setReferralVerification(null);
                          })
                          .catch(() => {});
                      } else {
                        setReferralVerification(null);
                      }
                    }}
                    placeholder="e.g. ASHI4F19"
                    className={`w-full bg-transparent text-xs sm:text-sm font-mono font-black tracking-wider uppercase focus:outline-none min-w-0 ${
                      isReferralLocked ? 'text-blue-950 cursor-default' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />

                  {isReferralLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold tracking-tight shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Applied</span>
                    </span>
                  )}
                </div>

                {referralVerification?.valid && (
                  <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 px-1">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>
                      Invited by <strong className="font-black text-emerald-800">@{referralVerification.referrerUsername}</strong>
                    </span>
                  </p>
                )}
              </div>

              {/* Terms Checkbox matching screenshot */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="agree-terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agree-terms-checkbox" className="text-xs text-slate-600 leading-tight cursor-pointer">
                  I agree to the <span className="font-bold text-slate-800">Terms of Service</span> and <span className="font-bold text-slate-800">Privacy Policy</span>
                </label>
              </div>

              {/* The Action Button ("payment button which will the create account button") */}
              <button
                id="auth-create-account-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#1b2b80] hover:bg-[#14236b] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-blue-950/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  or sign up with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Bottom Toggle matching screenshot: Already have an account? Login */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    id="switch-to-login-btn"
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('login');
                    }}
                    className="font-bold text-[#1b2b80] hover:underline cursor-pointer ml-1"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= LOGIN MODE ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Identifier: Email / Username / Phone */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="login-identifier-input"
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email, Username or Phone"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
              </div>

              {/* Password */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Sign In Button */}
              <button
                id="auth-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#1b2b80] hover:bg-[#14236b] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-blue-950/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In with Password</span>
                )}
              </button>

              {/* Toggle to Register */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Don&#39;t have an account?{' '}
                  <button
                    id="switch-to-register-btn"
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('register');
                    }}
                    className="font-bold text-[#1b2b80] hover:underline cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
