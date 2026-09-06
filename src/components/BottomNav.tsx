import React from 'react';
import { Home, CheckSquare, Wallet, Users, User, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export type NavTab = 'home' | 'tasks' | 'wallet' | 'referrals' | 'profile' | 'admin';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdmin?: boolean;
  unreadNotifications?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isAdmin = false
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'tasks' as NavTab, label: 'Tasks', icon: CheckSquare },
    { id: 'wallet' as NavTab, label: 'Wallet', icon: Wallet, isCenter: true },
    { id: 'referrals' as NavTab, label: 'Referrals', icon: Users },
    { id: 'profile' as NavTab, label: 'Profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-1 pointer-events-none">
      <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto pointer-events-auto">
        <nav
          id="pesa-bottom-navigation"
          aria-label="Main Navigation"
          className="relative bg-white/95 backdrop-blur-md rounded-[28px] border border-slate-200/80 shadow-[0_12px_36px_rgba(15,42,107,0.12)] px-3 py-2 flex items-center justify-between"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isCenter) {
              return (
                <div key={item.id} className="relative -top-5 flex flex-col items-center">
                  <motion.button
                    id={`nav-item-${item.id}`}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onTabChange(item.id)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-blue-600/40 ring-4 ring-blue-100'
                        : 'bg-gradient-to-tr from-blue-800 to-blue-600 text-white shadow-blue-900/30'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-6 h-6 stroke-[2.3]" />
                  </motion.button>
                  <span
                    className={`text-[11px] font-semibold mt-1 transition-colors ${
                      isActive ? 'text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 relative group"
              >
                <div
                  className={`w-10 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                    isActive ? 'text-blue-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-700"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
