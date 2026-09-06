import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  Clock,
  Lock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Radio,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { SystemSettings, User } from '../types.ts';
import { PesaCashLogo } from './BrandAssets.tsx';
import { SUPPORT_CONFIG } from '../constants.ts';

interface MaintenanceScreenProps {
  settings: SystemSettings | null;
  onRefresh: () => Promise<void>;
  onOpenAdminLogin: () => void;
  onContactAdmin: () => void;
  currentUser: User | null;
  onEnterAdminConsole?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  settings,
  onRefresh,
  onOpenAdminLogin,
  onContactAdmin,
  currentUser,
  onEnterAdminConsole
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedNotice, setRefreshedNotice] = useState(false);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setRefreshedNotice(false);
    try {
      await onRefresh();
      setRefreshedNotice(true);
      setTimeout(() => setRefreshedNotice(false), 3000);
    } catch (e) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const message =
    settings?.maintenanceMessage ||
    'Pesa Cash is undergoing scheduled system optimization to improve instant payment processing and system reliability. We will be back online shortly.';

  const estimatedTime = settings?.estimatedEndTime;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div
      id="maintenance-screen-root"
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden"
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PesaCashLogo size="md" variant="white" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>Maintenance Mode</span>
          </div>

          {isAdmin && onEnterAdminConsole && (
            <button
              id="maintenance-enter-admin-btn"
              onClick={onEnterAdminConsole}
              className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          {/* Central Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Wrench className="w-10 h-10 animate-bounce" style={{ animationDuration: '2.5s' }} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[10px] border-2 border-slate-900">
              !
            </div>
          </div>

          {/* Titles & Headings */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Scheduled System Maintenance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              We are currently carrying out vital upgrades and carrier infrastructure improvements.
            </p>
          </div>

          {/* Admin Announcement Message Box */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>System Announcement</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium text-xs break-words whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* ETA / Estimated Time if configured */}
          {estimatedTime && (
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-left">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold text-blue-200 block text-[11px]">Estimated Downtime / ETA</span>
                  <span className="text-white font-extrabold text-xs">{estimatedTime}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-300 px-2 py-0.5 rounded-md bg-blue-500/20">
                In Progress
              </span>
            </div>
          )}

          {/* Security & Funds Reassurance */}
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-200 font-medium">
              <strong>Your Funds Are 100% Safe:</strong> All account balances, pending commissions, and task records remain secure and untouched.
            </p>
          </div>

          {/* Refreshed Toast Notification */}
          {refreshedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status verified. Maintenance is still ongoing.</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              id="maintenance-refresh-btn"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Live Status...' : 'Check If System Is Back Online'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={SUPPORT_CONFIG.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Updates</span>
              </a>

              <button
                type="button"
                onClick={onContactAdmin}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>

          {/* Admin Sign In Section */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">System Administrator?</span>
            </div>

            {isAdmin ? (
              <button
                onClick={onEnterAdminConsole}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                id="maintenance-admin-login-btn"
                onClick={onOpenAdminLogin}
                className="text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 text-center text-slate-500 text-[11px]">
        <p>© 2026 Pesa Cash Uganda. Licensed mobile money and partner rewards service.</p>
      </footer>
    </div>
  );
};
