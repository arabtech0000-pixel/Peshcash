import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Coins, ExternalLink, Wrench, ShieldAlert } from 'lucide-react';
import { User, Wallet, Task, TransactionHistoryItem, ReferralStats, NotificationItem, SystemSettings } from './types.ts';
import { api, getStoredToken, setStoredToken } from './lib/api.ts';
import {
  listenToRealtimeWallet,
  listenToRealtimeNotifications,
  listenToRealtimeSystemSettings,
  logoutFirebase,
  syncUserRealtimeRecord
} from './lib/firebase.ts';
import { Header } from './components/Header.tsx';
import { BottomNav, NavTab } from './components/BottomNav.tsx';
import { HomeView } from './components/Views/HomeView.tsx';
import { TasksView } from './components/Views/TasksView.tsx';
import { WalletView } from './components/Views/WalletView.tsx';
import { ReferralsView } from './components/Views/ReferralsView.tsx';
import { ProfileView } from './components/Views/ProfileView.tsx';
import { AdminView } from './components/Views/AdminView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ActivationModal } from './components/ActivationModal.tsx';
import { WithdrawModal } from './components/WithdrawModal.tsx';
import { DailySpinModal } from './components/DailySpinModal.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { SignInPage } from './components/SignInPage.tsx';
import { ContactAdminModal } from './components/ContactAdminModal.tsx';
import { MaintenanceScreen } from './components/MaintenanceScreen.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [loading, setLoading] = useState(true);

  // Check if this device already has an account or has been used before
  const [hasAccountOnDevice, setHasAccountOnDevice] = useState(() => {
    try {
      return localStorage.getItem('pesa_has_account') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [contactAdminModalOpen, setContactAdminModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [spinModalOpen, setSpinModalOpen] = useState(false);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [activeTaskForModal, setActiveTaskForModal] = useState<Task | null>(null);
  const [initialRefCode, setInitialRefCode] = useState('');

  // Read URL query for referral code e.g. /signup?ref=XYZ or /?ref=XYZ
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referralCode');
      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        setInitialRefCode(cleanRef);
        localStorage.setItem('pendingReferralCode', cleanRef);
      } else {
        const savedRef = localStorage.getItem('pendingReferralCode');
        if (savedRef) {
          setInitialRefCode(savedRef.trim().toUpperCase());
        }
      }

      // If user landed on /signup or has a ref code, pre-open registration
      const isSignUpRoute = window.location.pathname.startsWith('/signup');
      if (isSignUpRoute || ref) {
        setAuthModalMode('register');
        setAuthModalOpen(true);
      }
    } catch (e) {}
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await api.getSystemSettings();
      if (res?.settings) {
        setSystemSettings(res.settings);
      }
    } catch (e) {}
  };

  // Check Auth & Bootstrap Application
  const bootstrap = async () => {
    try {
      await fetchSystemSettings();
      const token = getStoredToken();
      if (token) {
        const meRes = await api.me();
        setUser(meRes.user);
        setWallet(meRes.wallet);
        try {
          localStorage.setItem('pesa_has_account', 'true');
          setHasAccountOnDevice(true);
        } catch (e) {}
      }
    } catch (err) {
      setStoredToken('');
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  // Fetch contextual tab data
  const refreshUserData = async () => {
    try {
      const [walletRes, tasksRes, notifsRes] = await Promise.all([
        api.getWallet(),
        api.getTasks(),
        api.getNotifications()
      ]);
      if (walletRes?.wallet) setWallet(walletRes.wallet);
      if (tasksRes?.tasks) setTasks(tasksRes.tasks);
      if (notifsRes?.notifications) setNotifications(notifsRes.notifications);
    } catch (e) {}
  };

  useEffect(() => {
    if (user) {
      refreshUserData();
      // Sync user profile and wallet to Realtime Database
      if (wallet) {
        syncUserRealtimeRecord(user, wallet);
      }

      // Realtime Database listeners for live wallet and notifications
      const unsubWallet = listenToRealtimeWallet(user.id, (realtimeWallet) => {
        if (realtimeWallet && typeof realtimeWallet === 'object') {
          setWallet((prev) => ({ ...prev, ...realtimeWallet }));
        }
      });

      const unsubNotifs = listenToRealtimeNotifications(user.id, (realtimeNotifs) => {
        if (Array.isArray(realtimeNotifs) && realtimeNotifs.length > 0) {
          setNotifications(realtimeNotifs);
        }
      });

      return () => {
        unsubWallet();
        unsubNotifs();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    const unsubSettings = listenToRealtimeSystemSettings((realtimeSettings) => {
      if (realtimeSettings) {
        setSystemSettings((prev) => ({ ...prev, ...realtimeSettings }));
      }
    });
    return () => {
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    if (activeTab === 'wallet') {
      api.getTransactionHistory().then((res) => setTransactions(res?.transactions || []));
    } else if (activeTab === 'referrals') {
      api.getReferralStats().then((res) => {
        if (res?.stats) {
          setReferralStats(res.stats);
        }
      });
    }
  }, [activeTab, user]);

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {}
    setStoredToken('');
    setUser(null);
    setWallet(null);
    setActiveTab('home');
    try {
      localStorage.setItem('pesa_has_account', 'true');
      setHasAccountOnDevice(true);
    } catch (e) {}
  };

  const handleOpenSignUp = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleOpenSignIn = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleOpenContactAdmin = () => {
    setContactAdminModalOpen(true);
  };

  const handleAuthSuccess = (loggedInUser: User, initialWallet: Wallet) => {
    try {
      localStorage.setItem('pesa_has_account', 'true');
      setHasAccountOnDevice(true);
      if (window.location.pathname.startsWith('/signup') || window.location.search.includes('ref=')) {
        window.history.replaceState({}, '', '/');
      }
    } catch (e) {}
    setUser(loggedInUser);
    setWallet(initialWallet);
    setAuthModalOpen(false);
  };

  const unreadNotifs = (notifications || []).filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071330] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h1 className="text-xl font-extrabold tracking-tight">PESA CASH</h1>
        <p className="text-xs text-blue-200/70 mt-1">Starting secure agency environment...</p>
      </div>
    );
  }

  // If Maintenance Mode is Active and user is NOT an admin:
  // Intercept all regular traffic and display the dedicated Maintenance Screen
  if (systemSettings?.maintenanceMode && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-950">
        <MaintenanceScreen
          settings={systemSettings}
          onRefresh={fetchSystemSettings}
          onOpenAdminLogin={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
          onContactAdmin={handleOpenContactAdmin}
          currentUser={user}
          onEnterAdminConsole={() => setActiveTab('admin')}
        />

        {/* Auth Modal for Admin Login */}
        <AuthModal
          isOpen={authModalOpen}
          defaultMode={authModalMode}
          initialReferralCode={initialRefCode}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Contact Admin Modal */}
        <ContactAdminModal
          isOpen={contactAdminModalOpen}
          onClose={() => setContactAdminModalOpen(false)}
        />
      </div>
    );
  }

  // If user is NOT logged in:
  // For devices with an existing account or after logout, show the Sign In page directly.
  // For new devices that have never created an account, show the Landing Page.
  if (!user) {
    if (hasAccountOnDevice) {
      return (
        <div className="min-h-screen bg-slate-50">
          <SignInPage
            onSuccess={handleAuthSuccess}
            onContactAdmin={handleOpenContactAdmin}
            initialMode={window.location.pathname.startsWith('/signup') || !!initialRefCode ? 'register' : 'login'}
            initialReferralCode={initialRefCode}
          />

          <ContactAdminModal
            isOpen={contactAdminModalOpen}
            onClose={() => setContactAdminModalOpen(false)}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <LandingPage
          onOpenSignUp={handleOpenSignUp}
          onOpenSignIn={handleOpenSignIn}
          onContactAdmin={handleOpenContactAdmin}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          defaultMode={authModalMode}
          initialReferralCode={initialRefCode}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Contact Admin Modal */}
        <ContactAdminModal
          isOpen={contactAdminModalOpen}
          onClose={() => setContactAdminModalOpen(false)}
        />
      </div>
    );
  }

  // Logged-in User Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Responsive container adapting smoothly across mobile, tablet, and desktop */}
      <div className="w-full max-w-2xl lg:max-w-3xl min-h-screen bg-white shadow-sm sm:border-x sm:border-slate-200/60 relative flex flex-col">
        {/* Top Sticky Alert if Maintenance Mode is Active for Admin */}
        {systemSettings?.maintenanceMode && user?.role === 'admin' && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              <span className="font-extrabold tracking-wide uppercase text-[11px]">
                Maintenance Mode Active — Public Blocked
              </span>
            </div>
            {activeTab !== 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 font-black text-[10px] uppercase tracking-wider hover:bg-slate-900 transition-colors"
              >
                Admin Console
              </button>
            )}
          </div>
        )}

        {/* Top Header */}
        <Header
          user={user}
          unreadNotificationsCount={unreadNotifs}
          onOpenNotifications={() => setNotificationsModalOpen(true)}
          onOpenActivation={() => setActivationModalOpen(true)}
          onOpenAdmin={() => setActiveTab('admin')}
          onContactAdmin={handleOpenContactAdmin}
        />

        {/* Tab View Container */}
        <main className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <HomeView
                  user={user}
                  wallet={wallet}
                  tasks={tasks}
                  onOpenWithdraw={() => setWithdrawModalOpen(true)}
                  onOpenSpin={() => {
                    if (user?.status !== 'active') {
                      setActivationModalOpen(true);
                      return;
                    }
                    setSpinModalOpen(true);
                  }}
                  onOpenReferrals={() => setActiveTab('referrals')}
                  onOpenActivation={() => setActivationModalOpen(true)}
                  onStartTask={(t) => {
                    if (user?.status !== 'active') {
                      setActivationModalOpen(true);
                      return;
                    }
                    setActiveTaskForModal(t);
                  }}
                  onViewAllTasks={() => setActiveTab('tasks')}
                />
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TasksView
                  tasks={tasks}
                  user={user}
                  onStartTask={(t) => {
                    if (user?.status !== 'active') {
                      setActivationModalOpen(true);
                      return;
                    }
                    setActiveTaskForModal(t);
                  }}
                  onOpenSpin={() => {
                    if (user?.status !== 'active') {
                      setActivationModalOpen(true);
                      return;
                    }
                    setSpinModalOpen(true);
                  }}
                  onOpenActivation={() => setActivationModalOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <WalletView
                  wallet={wallet}
                  user={user}
                  transactions={transactions}
                  onOpenWithdraw={() => {
                    if (user?.status !== 'active') {
                      setActivationModalOpen(true);
                      return;
                    }
                    setWithdrawModalOpen(true);
                  }}
                  onOpenActivation={() => setActivationModalOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'referrals' && (
              <motion.div
                key="referrals"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ReferralsView
                  user={user}
                  referralStats={referralStats}
                  onOpenActivation={() => setActivationModalOpen(true)}
                  onRefresh={() => {
                    api.getReferralStats().then((res) => {
                      if (res?.stats) setReferralStats(res.stats);
                    });
                    refreshUserData();
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileView
                  user={user}
                  onOpenActivation={() => setActivationModalOpen(true)}
                  onOpenAdmin={() => setActiveTab('admin')}
                  onLogout={handleLogout}
                  onUserUpdated={(u) => setUser(u)}
                  onContactAdmin={handleOpenContactAdmin}
                />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AdminView
                  onBackToApp={() => setActiveTab('home')}
                  onSettingsUpdated={(newSettings) => setSystemSettings(newSettings)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Floating Navigation (5-item bar with elevated center wallet) */}
        {activeTab !== 'admin' && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            isAdmin={user?.role === 'admin'}
            unreadNotifications={unreadNotifs}
          />
        )}

        {/* Modals & Dialogs */}
        <AuthModal
          isOpen={authModalOpen}
          defaultMode={authModalMode}
          initialReferralCode={initialRefCode}
          onSuccess={(loggedInUser, initialWallet) => {
            setUser(loggedInUser);
            setWallet(initialWallet);
            setAuthModalOpen(false);
          }}
          onClose={() => {
            setAuthModalOpen(false);
          }}
        />

        <ActivationModal
          isOpen={activationModalOpen}
          user={user}
          onClose={() => setActivationModalOpen(false)}
          onActivated={(updatedUser, updatedWallet) => {
            setUser(updatedUser);
            setWallet(updatedWallet);
            refreshUserData();
          }}
        />

        <ContactAdminModal
          isOpen={contactAdminModalOpen}
          onClose={() => setContactAdminModalOpen(false)}
        />

        <WithdrawModal
          isOpen={withdrawModalOpen}
          user={user}
          wallet={wallet}
          onClose={() => setWithdrawModalOpen(false)}
          onWithdrawalSuccess={(updatedWallet) => {
            setWallet(updatedWallet);
            refreshUserData();
          }}
        />

        <DailySpinModal
          isOpen={spinModalOpen}
          user={user}
          onClose={() => setSpinModalOpen(false)}
          onRewardWon={(_, updatedWallet) => {
            setWallet(updatedWallet);
            refreshUserData();
          }}
        />

        <TaskModal
          task={activeTaskForModal}
          onClose={() => setActiveTaskForModal(null)}
          onTaskCompleted={(_, updatedWallet) => {
            setWallet(updatedWallet);
            refreshUserData();
            setActiveTaskForModal(null);
          }}
        />

        <NotificationsModal
          isOpen={notificationsModalOpen}
          onClose={() => setNotificationsModalOpen(false)}
          notifications={notifications}
          onMarkAllRead={async () => {
            await api.markNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          }}
        />
      </div>
    </div>
  );
}
