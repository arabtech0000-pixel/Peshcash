import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  LogOut,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, PaymentProvider } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { MTNMoMoAppIcon, AirtelMoneyAppIcon } from '../BrandAssets.tsx';
import { SUPPORT_CONFIG, getWhatsAppHelpUrl } from '../../constants.ts';

interface ProfileViewProps {
  user: UserType | null;
  onOpenAdmin?: () => void;
  onOpenActivation?: () => void;
  onLogout: () => void;
  onUserUpdated: (updatedUser: UserType) => void;
  onContactAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenAdmin,
  onOpenActivation,
  onLogout,
  onUserUpdated,
  onContactAdmin
}) => {
  // Edit Profile / Withdrawal Settings State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [withdrawalPhone, setWithdrawalPhone] = useState(user?.withdrawalPhone || user?.phone || '');
  const [provider, setProvider] = useState<PaymentProvider>(user?.defaultProvider || 'MTN_MOMO');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const isAccountActive = user?.status === 'active';

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const res = await api.updateProfile({
        fullName,
        withdrawalPhone,
        defaultProvider: provider
      });

      setSaveSuccess(true);
      onUserUpdated(res.user);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    setPassSuccess('');
    setPassError('');

    try {
      const res = await api.changePassword({ oldPassword, newPassword });
      setPassSuccess(res.message);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  const faqs = [
    {
      q: 'Why is there a UGX 10,000 activation fee?',
      a: 'The activation fee validates genuine subscriber SIM identities, protects our advertising partners from automated bot syndicates, and funds your active Pesa Cash agency license for unlimited reward tasks and withdrawals.'
    },
    {
      q: 'When do referral rewards credit to my account?',
      a: 'Referral rewards of UGX 5,000 credit to your separate Referral Wallet immediately once your referred friend completes their verified Mobile Money activation.'
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal is UGX 10,000 with a standard charge reduction of UGX 1,000. Payouts are routed directly to your registered MTN MoMo or Airtel Money number within standard carrier processing batches.'
    },
    {
      q: 'Are task rewards guaranteed returns?',
      a: 'No. Pesa Cash is strictly an engagement agency and micro-task rewards platform. Rewards are funded through verified advertiser engagement, sponsored media, and surveys.'
    }
  ];

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Account Profile
        </h2>
        <p className="text-xs text-slate-500">
          Personal details, payout carrier settings, security, and agency support
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base text-slate-900 truncate">
              {user?.fullName}
            </h3>
            <div className="text-xs text-slate-500 truncate">@{user?.username}</div>
            <div className="mt-1">
              {user?.status === 'active' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Verified Active Account</span>
                </span>
              ) : (
                <button
                  onClick={onOpenActivation}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Pending Activation</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={onOpenAdmin}
            className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>

      {/* Mobile Money Withdrawal Settings */}
      <form
        onSubmit={handleUpdateSettings}
        className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
          Default Withdrawal Settings
        </h3>

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {saveError}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 block">Full Legal Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Default Mobile Money Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProvider('MTN_MOMO')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                provider === 'MTN_MOMO'
                  ? 'bg-amber-50/50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-600/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MTNMoMoAppIcon className="w-6 h-6" />
              <span>MTN Mobile Money</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider('AIRTEL_MONEY')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                provider === 'AIRTEL_MONEY'
                  ? 'bg-red-50/50 border-red-600 text-red-900 shadow-xs ring-1 ring-red-600/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AirtelMoneyAppIcon className="w-6 h-6" />
              <span>Airtel Money</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 block">
            Registered Payout Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <input
              type="tel"
              required
              value={withdrawalPhone}
              onChange={(e) => setWithdrawalPhone(e.target.value)}
              placeholder="+256 7XX XXX XXX"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          {saving ? 'Saving...' : 'Save Payout Details'}
        </button>
      </form>

      {/* Security: Change Password */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-xs space-y-3"
      >
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-blue-700" />
          <span>Security & Password</span>
        </h3>

        {passSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {passSuccess}
          </div>
        )}
        {passError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {passError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={changingPass}
          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          {changingPass ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-xs space-y-2">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-700" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    expandedFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {expandedFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-50 bg-slate-50/40">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Official Community Hub & Support */}
      <div className="p-4 rounded-[24px] bg-blue-50/70 border border-blue-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-blue-950 truncate">Official WhatsApp &amp; Admin Hub</h4>
              <p className="text-[10px] text-blue-700 truncate">Connect with 18,000+ Ugandan members</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <a
            href={SUPPORT_CONFIG.whatsappGroupUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="truncate">WhatsApp Group</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          <a
            href={SUPPORT_CONFIG.whatsappChannelUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="truncate">WhatsApp Channel</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          <button
            type="button"
            onClick={onContactAdmin ? onContactAdmin : () => window.open(SUPPORT_CONFIG.whatsappDirectUrl, '_blank')}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span className="truncate">Contact Support</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <button
        id="profile-logout-btn"
        onClick={onLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200/80 cursor-pointer"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Log Out of Pesa Cash</span>
      </button>
    </div>
  );
};
