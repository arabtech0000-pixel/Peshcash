import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  MessageCircle,
  ExternalLink,
  Coins,
  Zap,
  ArrowRight,
  TrendingUp,
  Award,
  HelpCircle,
  Sparkles,
  PlayCircle,
  Clock,
  Lock,
  Headphones,
  FileText,
  BadgeCheck,
  Smartphone,
  ChevronDown,
  Gift
} from 'lucide-react';
import { MTNMoMoBadge, AirtelMoneyBadge, MTNMoMoAppIcon, AirtelMoneyAppIcon } from './BrandAssets.tsx';
import { SUPPORT_CONFIG, getWhatsAppHelpUrl } from '../constants.ts';

interface LandingPageProps {
  onOpenSignUp: () => void;
  onOpenSignIn: () => void;
  onContactAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSignUp,
  onOpenSignIn,
  onContactAdmin
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // WhatsApp Community Links
  const whatsappGroupUrl = SUPPORT_CONFIG.whatsappGroupUrl;
  const whatsappChannelUrl = SUPPORT_CONFIG.whatsappChannelUrl;
  const adminWhatsAppUrl = getWhatsAppHelpUrl("Hello Pesa Cash Support, I need assistance with my account.");

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Floating Announcement Bar */}
      <div className="bg-gradient-to-r from-[#0a1b44] via-[#102d6e] to-[#0a1b44] text-white py-2 px-4 text-center text-xs font-medium border-b border-white/10 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM LIVE
        </span>
        <span>Uganda&#39;s Premier Mobile Money Rewards &amp; Agency Platform. Instant MTN &amp; Airtel Payouts!</span>
        <button
          onClick={onOpenSignUp}
          className="underline hover:text-amber-300 font-bold ml-1 cursor-pointer transition-colors"
        >
          Join Free &rarr;
        </button>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-950">PESA CASH</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold tracking-wider">UG</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Verified Money &amp; Rewards Agency</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#about-us" className="hover:text-blue-600 transition-colors">About Us</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works (Guides)</a>
            <a href="#earnings" className="hover:text-blue-600 transition-colors">Earning Rates</a>
            <a href="#community" className="hover:text-blue-600 transition-colors">Community</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="landing-signin-nav-btn"
              onClick={onOpenSignIn}
              className="px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-all border border-slate-200"
            >
              Sign In
            </button>
            <button
              id="landing-signup-nav-btn"
              onClick={onOpenSignUp}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 shadow-md shadow-blue-700/25 transition-all active:scale-95"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c2356] via-[#102d6e] to-[#143987] text-white pt-12 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6">
        {/* Soft Background Cloud and Lighting Accents */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-blue-100 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Uganda&#39;s Most Trusted Digital Task Agency</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-amber-200 font-bold">UGX Payouts</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white mb-6">
            Earn Real Money Daily <br className="hidden sm:inline" />
            Direct to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">MTN &amp; Airtel</span> Phone
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Complete high-paying sponsor surveys, watch sponsored brand ads, spin the daily lucky wheel, and earn <span className="text-amber-300 font-bold">UGX 5,000</span> for every verified friend you invite direct to your MTN &amp; Airtel Mobile Money wallet!
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-10">
            <button
              id="hero-create-account-btn"
              onClick={onOpenSignUp}
              className="w-full sm:w-auto flex-1 px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base shadow-lg shadow-amber-400/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-signin-btn"
              onClick={onOpenSignIn}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
            </button>
          </div>

          {/* WhatsApp Direct Action Hub */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 max-w-2xl mx-auto shadow-xl">
            <p className="text-xs font-semibold text-blue-100 mb-3 flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>OFFICIAL COMMUNITY &amp; SUPPORT CHANNELS:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp Group */}
              <a
                id="hero-whatsapp-group-btn"
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Join WhatsApp Group</span>
              </a>

              {/* WhatsApp Channel */}
              <a
                id="hero-whatsapp-channel-btn"
                href={whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Join WhatsApp Channel</span>
              </a>

              {/* Contact Admin */}
              <button
                id="hero-contact-admin-btn"
                onClick={onContactAdmin}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs border border-white/20 shadow-md transition-all active:scale-95"
              >
                <Headphones className="w-4 h-4 text-amber-300" />
                <span>Contact Admin</span>
              </button>
            </div>
          </div>

          {/* Supported Mobile Money Brands */}
          <div className="mt-10 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-xs text-blue-200 font-bold uppercase tracking-wider">Accepted Payout Networks:</span>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 border border-white/40">
              <MTNMoMoAppIcon className="w-6 h-6" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-900 leading-tight">MTN MoMo</span>
                <span className="text-[10px] text-amber-700 font-bold font-mono leading-none">*165#</span>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 border border-white/40">
              <AirtelMoneyAppIcon className="w-6 h-6" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-900 leading-tight">Airtel Money</span>
                <span className="text-[10px] text-red-600 font-bold font-mono leading-none">*185#</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Live Statistics Counter */}
      <section className="relative -mt-8 max-w-5xl mx-auto px-4 sm:px-6 z-20">
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-200/80 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-900">UGX 145M+</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Paid to Ugandan Members</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-900">18,500+</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Registered &amp; Active Earners</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-900">UGX 5,000</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Direct Referral Bonus</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">Instant</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Mobile Money Payouts</p>
          </div>
        </div>
      </section>

      {/* Section: Who We Are / About Us ("Describes Us") */}
      <section id="about-us" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-100">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>TRANSPARENT &amp; VERIFIED PLATFORM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            About PESA CASH Uganda
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Connecting real Ugandan mobile phone users with top consumer brands, sponsor research agencies, and digital market insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-5">
              <Coins className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real Brand Advertising</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Global and local brands allocate marketing budgets to get authentic Ugandan consumer feedback, video views, and survey responses. We distribute these revenue shares directly into member wallets.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-5">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">One-Time Activation Model</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A nominal one-time agent activation fee verifies real human phone numbers, eliminates fraudulent bots, unlocks your daily task quota, and powers the automated mobile money cashout gateway.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-5">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Direct Mobile Money Cashouts</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No complicated crypto, PayPal, or foreign gift cards. Withdraw your earnings straight to your MTN Mobile Money or Airtel Money phone number in Ugandan Shillings (UGX).
            </p>
          </div>
        </div>
      </section>

      {/* Section: Step-by-Step Guides ("Guides") */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-3 border border-indigo-100">
              <FileText className="w-3.5 h-3.5" />
              <span>STEP-BY-STEP USER GUIDE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How PESA CASH Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Follow these simple 5 steps to start earning and withdrawing cash from your phone today.
            </p>
          </div>

          <div className="space-y-6">
            {/* Guide Step 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Create Your Free Account</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">30 Seconds</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Click the <strong>Create Account</strong> button. Enter your username, your active Uganda mobile phone number (MTN or Airtel), your email address, and your desired password. Weak passwords are fully supported so you never get locked out.
                </p>
              </div>
              <button
                onClick={onOpenSignUp}
                className="shrink-0 px-4 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors border border-blue-200"
              >
                Sign Up Now &rarr;
              </button>
            </div>

            {/* Guide Step 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Activate Your Agent License</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">One-Time Only</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pay the one-time agency activation fee of <strong>UGX 10,000</strong> using your MTN Mobile Money or Airtel Money phone number. Your account is activated instantly and unlocks your free welcome spin and unlimited tasks.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <MTNMoMoBadge />
                <AirtelMoneyBadge />
              </div>
            </div>

            {/* Guide Step 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Complete Daily Sponsor Tasks &amp; Free Spins</h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">Daily Earnings</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Go to the <strong>Tasks</strong> tab to claim brand surveys (e.g. telecom preferences, beverage choices), watch sponsored partner video ads, test security quizzes, and spin the Daily Wheel to win cash prizes up to UGX 25,000 every single day.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold text-indigo-600 block">Up to UGX 15,000/day</span>
                <span className="text-[10px] text-slate-400">Direct Task Earnings</span>
              </div>
            </div>

            {/* Guide Step 4 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Share Your Referral Link on WhatsApp</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">UGX 5,000 per Invite</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Copy your unique referral link from your dashboard and post it to your WhatsApp status, TikTok, Facebook groups, or Telegram. Whenever a referee registers and activates, you earn an instant <strong>UGX 5,000</strong> commission credited to your Referral Wallet!
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold text-emerald-600 block">Instant Commission</span>
                <span className="text-[10px] text-slate-400">No Limit on Invites</span>
              </div>
            </div>

            {/* Guide Step 5 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-slate-900/20">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Withdraw Directly to Mobile Money</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">24/7 Available</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Head to the <strong>Wallet</strong> tab, tap <strong>Withdraw</strong>, select your payout wallet (Daily Earnings or Referral Commissions), enter your amount (minimum UGX 10,000), and confirm. Funds are dispatched directly to your MTN or Airtel SIM!
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold text-slate-900 block">Min: UGX 10,000</span>
                <span className="text-[10px] text-slate-400">Direct to Phone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Earning Breakdown & Rates */}
      <section id="earnings" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>TRANSPARENT REWARD STRUCTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Much Can You Earn?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            All earnings are calculated and paid out in standard Ugandan Shillings (UGX).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 w-fit mb-4">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Daily Sponsor Tasks</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Surveys, video review &amp; brand quizzes</p>
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Consumer Surveys:</span>
                <span className="font-bold text-slate-900">UGX 1,500 - 3,500 each</span>
              </div>
              <div className="flex justify-between py-1">
                <span>15-Sec Video Ads:</span>
                <span className="font-bold text-slate-900">UGX 650 - 1,200 each</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Knowledge Quiz:</span>
                <span className="font-bold text-slate-900">UGX 3,000 each</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-md relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
              MOST POPULAR
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 w-fit mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Agency Referrals</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Share your link with Ugandan friends</p>
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Per Active Referral:</span>
                <span className="font-bold text-emerald-600">UGX 5,000 instant</span>
              </div>
              <div className="flex justify-between py-1">
                <span>10 Referrals / Week:</span>
                <span className="font-bold text-slate-900">UGX 50,000</span>
              </div>
              <div className="flex justify-between py-1">
                <span>25 Referrals / Week:</span>
                <span className="font-bold text-slate-900">UGX 125,000</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 w-fit mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Daily Lucky Wheel</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Spin every 24 hours for instant bonuses</p>
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span>Daily Free Spin:</span>
                <span className="font-bold text-slate-900">1 Free every 24h</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Prizes:</span>
                <span className="font-bold text-slate-900">UGX 500 to 25,000</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Odds:</span>
                <span className="font-bold text-emerald-600">Guaranteed prize</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Official Community & WhatsApp Channels */}
      <section id="community" className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-[#0c2356] via-[#102d6e] to-[#0a1b44] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold mb-4 border border-white/20">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>JOIN 18,000+ UGANDANS ON WHATSAPP</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Connect With Our Official Community
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-xl mx-auto mb-10 leading-relaxed">
            Get daily payment proofs, talk directly with support admins, unlock exclusive bonus task codes, and chat with members from Kampala, Gulu, Mbarara, and Jinja.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left max-w-3xl mx-auto">
            {/* WhatsApp Group Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex flex-col justify-between hover:bg-white/15 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">WhatsApp Group</h3>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-4">
                  Interact with other members, share withdrawal screenshots, and exchange referral strategies.
                </p>
              </div>
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Join WhatsApp Group</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* WhatsApp Channel Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex flex-col justify-between hover:bg-white/15 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">WhatsApp Channel</h3>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-4">
                  Official broadcast channel for announcement drops, double-point weekends, and system updates.
                </p>
              </div>
              <a
                href={whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Join Official Channel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Contact Admin Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex flex-col justify-between hover:bg-white/15 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">Contact Admin</h3>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-4">
                  Direct support for activation assistance, withdrawal inquiries, or account questions. Available 24/7.
                </p>
              </div>
              <button
                onClick={onContactAdmin}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Chat With Admin</span>
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Got questions? We have clear answers.
          </p>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: "How do I register and start earning?",
              a: "Click 'Create Account', enter your username, Ugandan mobile number, email, and password. Complete your one-time activation, and your tasks and lucky spin will be unlocked immediately."
            },
            {
              q: "Why is there a one-time activation fee?",
              a: "The one-time activation fee guarantees that every member is a verified human with a registered SIM card. It stops spam bots and finances our instant payout liquidity pool."
            },
            {
              q: "How fast are withdrawals processed?",
              a: "Withdrawals are processed directly to your registered MTN Mobile Money (*165#) or Airtel Money (*185#) wallet. Standard cashouts arrive within minutes."
            },
            {
              q: "What is the minimum withdrawal amount?",
              a: "The minimum withdrawal is only UGX 10,000 for both Daily Tasks and Referral commissions. You can withdraw 24 hours a day, 7 days a week."
            },
            {
              q: "How much do I get for inviting friends?",
              a: "You receive an instant UGX 5,000 commission for every friend who registers and activates using your unique link or referral code."
            },
            {
              q: "Can I use any password?",
              a: "Yes! Weak passwords and simple passcodes are fully supported so you never have to struggle remembering complex symbols."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full py-4 px-5 text-left flex items-center justify-between font-bold text-slate-900 text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white py-14 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ready to Start Earning Today?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mb-8 leading-relaxed">
            Join thousands of active Ugandan youth earning daily task rewards and mobile money commissions right from their phones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignUp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-lg transition-all active:scale-95"
            >
              Create Account (Sign Up)
            </button>
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-all"
            >
              Already Have Account? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 text-xs border-t border-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>PESA CASH UGANDA</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Uganda&#39;s Premier Verified Digital Task &amp; Agency Network. Operating under licensed guidelines.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <a href="#about-us" className="hover:text-white transition-colors">About Us</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Guides</a>
            <a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp Group</a>
            <a href={whatsappChannelUrl} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">WhatsApp Channel</a>
            <button onClick={onContactAdmin} className="hover:text-amber-400 transition-colors cursor-pointer">Contact Admin</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-600 text-[11px] gap-2">
          <span>&copy; {new Date().getFullYear()} Pesa Cash Uganda. All rights reserved.</span>
          <span>Admin: ashirafashes04@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};
