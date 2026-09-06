import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Send,
  MessageCircle,
  Twitter,
  Sparkles,
  Link as LinkIcon,
  Smartphone
} from 'lucide-react';

interface ShareReferralLinkProps {
  referralCode: string;
  className?: string;
  variant?: 'card' | 'compact';
}

export const ShareReferralLink: React.FC<ShareReferralLinkProps> = ({
  referralCode,
  className = '',
  variant = 'card'
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pesacash.ug';
  const customReferralLink = `${origin}/signup?ref=${encodeURIComponent(referralCode)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(customReferralLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = customReferralLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (e) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (e) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const shareText = `Join me on Pesa Cash! Sign up with my referral link and earn daily cash via verified tasks, spins, and instant mobile money cashouts: ${customReferralLink}`;

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(customReferralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: 'Join Pesa Cash with my referral link',
          text: `Use my invite code ${referralCode} to sign up:`,
          url: customReferralLink
        });
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-200">
              Share Referral Link
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            +UGX 5,000 / referral
          </span>
        </div>

        <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-2">
          <div className="truncate text-xs font-mono text-blue-100 flex-1">
            {customReferralLink}
          </div>
          <button
            id="copy-referral-link-compact-btn"
            type="button"
            onClick={handleCopyLink}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-blue-950 hover:bg-blue-50 active:scale-95'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-950" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#0a1e4a] via-[#0f2d6b] to-[#1e1b4b] rounded-[28px] p-5 sm:p-6 text-white shadow-xl shadow-blue-950/25 border border-blue-800/40 relative overflow-hidden ${className}`}>
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Referral Link Generator</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-black text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
            +UGX 5,000 Instant
          </span>
        </div>
      </div>

      <div className="relative z-10 space-y-1 mb-4">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Share Your Custom Link
        </h3>
        <p className="text-xs text-blue-200/80 leading-relaxed max-w-lg">
          Friends who open your link have your referral code pre-filled automatically. When they sign up, your account is credited immediately.
        </p>
      </div>

      {/* Primary Referral Link Box */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/20 space-y-2 mb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-blue-300" />
            Your Dedicated Referral Link
          </span>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 transition-colors cursor-pointer font-semibold"
            >
              <Share2 className="w-3 h-3" />
              <span>Device Share</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="bg-black/30 rounded-xl px-3 py-2 text-xs font-mono text-white/95 border border-white/10 truncate flex-1 flex items-center select-all">
            {customReferralLink}
          </div>
          <button
            id="copy-referral-link-main-btn"
            type="button"
            onClick={handleCopyLink}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500 text-white scale-[1.02]'
                : 'bg-white text-blue-950 hover:bg-blue-50 active:scale-95'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span className="font-extrabold tracking-wide">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-900" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Referral Code Quick Copy */}
      <div className="relative z-10 bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] text-blue-200/90 uppercase font-bold tracking-wider block">
            Referral Code Only
          </span>
          <span className="text-base sm:text-lg font-black font-mono tracking-widest text-amber-300">
            {referralCode}
          </span>
        </div>
        <button
          id="copy-referral-code-btn"
          type="button"
          onClick={handleCopyCode}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
            copiedCode
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
          }`}
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-white/80" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Social Sharing Shortcuts */}
      <div className="relative z-10">
        <span className="text-[11px] font-bold text-blue-200/90 uppercase tracking-wider block mb-2">
          Instant Social Sharing
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleShareTelegram}
            className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={handleShareTwitter}
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>X (Twitter)</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer col-span-3 sm:col-span-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>More Options</span>
          </button>
        </div>
      </div>
    </div>
  );
};
