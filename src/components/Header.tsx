import React from 'react';
import { Bell, ShieldCheck, AlertCircle, ShieldAlert, Headphones } from 'lucide-react';
import { User } from '../types.ts';

interface HeaderProps {
  user: User | null;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenActivation: () => void;
  onOpenAdmin?: () => void;
  onContactAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenActivation,
  onOpenAdmin,
  onContactAdmin
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Member';

  return (
    <header className="relative bg-gradient-to-b from-[#0c2356] via-[#102d6e] to-[#153b8f] text-white pt-4 pb-14 px-4 sm:px-8 overflow-hidden rounded-b-[36px] shadow-lg shadow-blue-950/20">
      {/* Subtle geometric dot grid pattern matching screenshot reference */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Decorative ambient radial glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top Status & Controls Bar */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10 gap-2">
        {/* Brand identity badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-blue-100 font-semibold border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">PESA CASH</span>
          </div>
        </div>

        {/* Right side actions: Support + Admin shortcut + Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onContactAdmin && (
            <button
              id="contact-admin-header-btn"
              onClick={onContactAdmin}
              title="Contact Admin on WhatsApp"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-semibold transition-colors shrink-0"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Support</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              id="admin-portal-header-btn"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-semibold hover:bg-amber-400/30 transition-colors shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          <button
            id="notifications-header-btn"
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10 shrink-0"
          >
            <Bell className="w-4.5 h-4.5 text-blue-100" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0c2356] animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Greeting and Status Area */}
      <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-blue-200/90 tracking-wide uppercase truncate max-w-[180px] sm:max-w-none">
              {getGreeting()}, {firstName}
            </span>
            {user?.status === 'active' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>Active</span>
              </span>
            ) : (
              <button
                id="activate-account-pill-btn"
                onClick={onOpenActivation}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 hover:bg-amber-500/30 transition-colors shrink-0"
              >
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Pending Activation</span>
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mt-1 text-white break-words">
            Ready to Earn Today?
          </h1>
          <p className="text-xs text-blue-200/80 mt-0.5 line-clamp-2 break-words">
            Verified tasks, sponsor rewards & instant mobile money cashouts
          </p>
        </div>

        {/* User avatar */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-white/20 shadow-md bg-blue-800 flex items-center justify-center shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
              {firstName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
