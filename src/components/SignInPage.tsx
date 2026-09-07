import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Headphones,
  Tag,
  ArrowRight,
  Coins,
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, setStoredToken } from '../lib/api.ts';
import { MTNMoMoAppIcon, AirtelMoneyAppIcon } from './BrandAssets.tsx';
import {
  registerWithFirebaseEmail,
  loginWithFirebaseEmail,
  syncUserRealtimeRecord,
  syncUserFirestoreRecord
} from '../lib/firebase.ts';

interface SignInPageProps {
  onSuccess: (user: any, wallet: any) => void;
  onContactAdmin: () => void;
  initialMode?: 'login' | 'register';
  initialReferralCode?: string;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSuccess,
  onContactAdmin,
  initialMode = 'login',
  initialReferralCode = ''
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
    let codeCandidate = initialReferralCode ? initialReferralCode.trim().toUpperCase() : '';
    
    // Check URL query params (?ref=... or ?referralCode=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referralCode');
      if (urlRef) {
        codeCandidate = urlRef.trim().toUpperCase();
        localStorage.setItem('pendingReferralCode', codeCandidate);
      }
    } catch (e) {}

    // Check localStorage fallback
    if (!codeCandidate) {
      try {
        const stored = localStorage.getItem('pendingReferralCode');
        if (stored) {
          codeCandidate = stored.trim().toUpperCase();
        }
      } catch (e) {}
    }

    if (codeCandidate) {
      setReferralCode(codeCandidate);
      setIsReferralLocked(true);

      // Verify referral code with backend
      api.validateReferralCode(codeCandidate)
        .then((res) => {
          if (res?.valid) {
            setReferralVerification(res);
          } else {
            setReferralVerification(null);
          }
        })
        .catch(() => {});
    }
  }, [initialReferralCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your mobile phone number, email, or username');
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

      // Try Firebase email login in parallel if identifier is an email
      if (loginIdentifier.includes('@')) {
        try {
          await loginWithFirebaseEmail(loginIdentifier.trim(), loginPassword);
        } catch (fbErr: any) {
          try {
            await registerWithFirebaseEmail(loginIdentifier.trim(), loginPassword, res.user.fullName || res.user.username);
          } catch (e) {}
        }
      }

      // Mark device as having an account
      try {
        localStorage.setItem('pesa_has_account', 'true');
      } catch (e) {}

      // Sync Realtime Database
      await syncUserRealtimeRecord(res.user, res.wallet);

      setStoredToken(res.token);
      onSuccess(res.user, res.wallet);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please choose a username');
      return;
    }
    if (!phone || phone.trim().length < 9) {
      setErrorMessage('Please enter your valid Ugandan mobile phone number');
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
      setErrorMessage('Please agree to the Terms of Service to continue');
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

      // Also register in Firebase Auth
      try {
        await registerWithFirebaseEmail(email.trim(), password, username.trim());
      } catch (fbErr: any) {
        try {
          await loginWithFirebaseEmail(email.trim(), password);
        } catch (e) {}
      }

      // Clear pending referral code upon successful registration
      try {
        localStorage.removeItem('pendingReferralCode');
      } catch (e) {}

      // Sync Realtime Database & Firestore safely
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1e4a] via-[#0f2d70] to-[#163e94] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
      {/* Container with smooth max-width and no overflow */}
      <div className="w-full max-w-[430px] my-auto">
        {/* Top Floating Brand Identity */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-md">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[#0a1e4a] font-black text-xs">
              <Coins className="w-3 h-3 text-blue-950" />
            </div>
            <span className="text-xs font-black tracking-wider">PESA CASH UG</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Card Component */}
        <div className="w-full rounded-[36px] shadow-2xl overflow-hidden border border-white/40 bg-white relative">
          {/* Sky-Blue Backdrop with Clouds */}
          <div className="relative bg-gradient-to-b from-[#87c4fa] via-[#aedbfd] to-[#d9eeff] pt-6 pb-5 px-6 overflow-hidden">
            {/* 3D Fluffy White Clouds Graphic */}
            <div className="relative z-10 flex justify-center pointer-events-none mb-2">
              <svg
                className="w-40 h-16 drop-shadow-[0_8px_14px_rgba(255,255,255,0.85)] filter"
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
                </defs>
                <ellipse cx="65" cy="50" rx="35" ry="24" fill="url(#cloudGrad)" />
                <ellipse cx="105" cy="38" rx="42" ry="32" fill="url(#cloudGrad)" />
                <ellipse cx="145" cy="48" rx="36" ry="25" fill="url(#cloudGrad)" />
                <ellipse cx="100" cy="55" rx="75" ry="20" fill="url(#cloudGrad)" />
                <circle cx="95" cy="26" r="14" fill="#ffffff" opacity="0.6" />
                <circle cx="135" cy="36" r="10" fill="#ffffff" opacity="0.5" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-left relative z-20">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-700 font-medium mt-1 leading-snug">
                {mode === 'login'
                  ? 'Sign in to access your earnings and mobile money cashouts'
                  : 'Join Pesa Cash Uganda and start earning daily rewards'}
              </p>
            </div>
          </div>

          {/* Form Area */}
          <div className="bg-white px-5 sm:px-6 pb-6 pt-2 relative z-20 -mt-2 rounded-t-[28px]">
            {/* Grab handle */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="min-w-0 flex-1 break-words">{errorMessage}</span>
              </div>
            )}

            {/* ================= SIGN IN FORM ================= */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* Identifier Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Phone, Email or Username
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="signin-identifier-input"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. +256 7XX or username"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-3 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="signin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="signin-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1b2b80] hover:bg-[#14236b] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md shadow-blue-950/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Register */}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-600">
                    Need a new account?{' '}
                    <button
                      id="signin-switch-to-register-btn"
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
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegister} className="space-y-3">
                {/* Starter Bonus Banner */}
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="text-xs font-bold text-amber-950">UGX 1,000 New Account Bonus</p>
                      <p className="text-[10px] text-amber-800">Credited instantly upon registration</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300/80 shrink-0">
                    Free
                  </span>
                </div>

                {/* 1. Username */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name or Username
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-2.5 flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="register-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. John Bosco"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                  </div>
                </div>

                {/* 2. Mobile Phone Number */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ugandan Mobile Money Number
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-2.5 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="register-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+256 7XX XXX XXX"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                    <div className="flex items-center gap-1 shrink-0 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      <MTNMoMoAppIcon className="w-4 h-4" />
                      <AirtelMoneyAppIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Email */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-2.5 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="register-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-2.5 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="register-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Confirm Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Confirm Password
                  </label>
                  <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3.5 py-2.5 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="register-confirmpassword-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Code Field with Auto-fill, ReadOnly Lock, & Clear/Edit Option */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-700" />
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
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                      >
                        {isReferralLocked ? 'Change / Clear' : 'Clear'}
                      </button>
                    )}
                  </div>

                  <div
                    className={`relative rounded-2xl border transition-all px-3.5 py-2.5 flex items-center gap-2.5 ${
                      isReferralLocked
                        ? 'bg-blue-50/70 border-blue-200 text-blue-950 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/90 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100'
                    }`}
                  >
                    <Tag className={`w-4 h-4 shrink-0 ${isReferralLocked ? 'text-blue-700' : 'text-slate-400'}`} />
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

                {/* Terms Agreement */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="signin-terms-checkbox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="signin-terms-checkbox" className="text-xs text-slate-600 leading-tight cursor-pointer">
                    I agree to the <span className="font-bold text-slate-800">Terms of Service</span> and <span className="font-bold text-slate-800">Privacy Policy</span>
                  </label>
                </div>

                {/* Create Account Submit */}
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1b2b80] hover:bg-[#14236b] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md shadow-blue-950/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-600">
                    Already have an account?{' '}
                    <button
                      id="register-switch-to-login-btn"
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
          </div>
        </div>

        {/* Footer Support Link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onContactAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-blue-200/90 hover:text-white font-medium transition-colors"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-300" />
            <span>Need assistance? Contact WhatsApp Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};
