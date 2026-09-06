import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Coins,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Calendar,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';
import { User, ReferralStats } from '../../types.ts';
import { UgxCurrencyBadge } from '../BrandAssets.tsx';
import { ShareReferralLink } from '../ShareReferralLink.tsx';
import { api } from '../../lib/api.ts';
import { firestore } from '../../lib/firebase.ts';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface ReferralsViewProps {
  user: User | null;
  referralStats: ReferralStats | null;
  onOpenActivation?: () => void;
  onRefresh?: () => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({
  user,
  referralStats,
  onRefresh
}) => {
  const [liveReferrals, setLiveReferrals] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  const referralCode = user?.referralCode || '';

  // Listen to Firestore sub-collection 'users/{user.id}/referrals' if available
  useEffect(() => {
    if (!user?.id) return;
    try {
      const referralsSubCol = collection(firestore, 'users', user.id, 'referrals');
      const q = query(referralsSubCol, orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setLiveReferrals(records);
          }
        },
        () => {
          // Graceful fallback to backend api data
        }
      );
      return () => unsubscribe();
    } catch (e) {
      // Ignored if offline/local
    }
  }, [user?.id]);

  // Merge backend data and Firestore live sub-collection data
  const backendList = Array.isArray(referralStats?.referralsList)
    ? referralStats.referralsList
    : Array.isArray((referralStats as any)?.referrals)
    ? (referralStats as any).referrals
    : [];

  const displayList = liveReferrals.length > 0
    ? liveReferrals.map((lr) => {
        const matched = backendList.find(
          (b: any) => b.referredUserId === lr.referredUserId || b.id === lr.id
        );
        return {
          id: lr.id,
          referredUserId: lr.referredUserId,
          username: matched?.username || lr.referredUserId?.slice(0, 8) || 'Member',
          fullName: matched?.fullName || lr.referredUserId?.slice(0, 8) || 'Member',
          timestamp: lr.timestamp?.toDate ? lr.timestamp.toDate().toISOString() : lr.timestamp || lr.createdAt,
          status: lr.status || 'COMPLETED',
          rewardAmount: lr.rewardAmount || 5000
        };
      })
    : backendList.map((b: any) => ({
        id: b.id,
        referredUserId: b.referredUserId || b.refereeId || b.id,
        username: b.username || b.refereeUsername || 'Member',
        fullName: b.fullName || b.refereeName || 'Member',
        timestamp: b.timestamp || b.joinDate || b.createdAt,
        status: b.status || (b.qualifyingStatus === 'qualified' ? 'COMPLETED' : b.qualifyingStatus || 'COMPLETED'),
        rewardAmount: b.rewardAmount || b.commissionAmountUgx || 5000
      }));

  // Calculate distinct counts for Active vs Pending
  const activeFromList = displayList.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'qualified' || r.status === 'active'
  ).length;

  const pendingFromList = displayList.filter(
    (r) => r.status === 'pending_activation' || r.status === 'pending' || r.status === 'PENDING'
  ).length;

  const activeCount = Math.max(
    activeFromList,
    referralStats?.activeCount ?? referralStats?.qualifiedCount ?? referralStats?.activeInvites ?? 0
  );

  const pendingCount = Math.max(
    pendingFromList,
    referralStats?.pendingCount ?? referralStats?.pendingInvites ?? 0
  );

  const totalReferralsCount = Math.max(
    displayList.length,
    referralStats?.totalReferrals ?? referralStats?.totalInvites ?? 0,
    activeCount + pendingCount
  );

  const calculatedTotalEarnings = displayList.reduce((acc, r) => {
    return acc + (Number(r.rewardAmount) || 5000);
  }, 0);

  const amountCollected = Math.max(
    calculatedTotalEarnings,
    referralStats?.amountCollected ?? referralStats?.totalEarningsUgx ?? referralStats?.totalReferralEarnings ?? 0
  );

  // Filter display list according to user-selected tab
  const filteredReferrals = displayList.filter((item) => {
    const isActive =
      item.status === 'COMPLETED' || item.status === 'qualified' || item.status === 'active';
    const isPending =
      item.status === 'pending_activation' || item.status === 'pending' || item.status === 'PENDING';

    if (statusFilter === 'active') return isActive;
    if (statusFilter === 'pending') return isPending;
    return true;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    try {
      await api.getReferrals();
    } catch (e) {}
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/80 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            <span>Automated Referral Network</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Referrals & Commissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Share your personal referral link. Each sign-up is instantly recorded on the ledger and credited to your account.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Prominent Share Referral Link Generator Component */}
      <ShareReferralLink referralCode={referralCode} />

      {/* Referral Status Overview Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Referral Program Status:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active & Crediting
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reward Rate: <strong className="text-white font-bold">UGX 5,000</strong> per friend • Instant Wallet Crediting
            </p>
          </div>
        </div>

        {/* Live Status Pill Stats */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
          <span className="text-slate-300 font-semibold">Status:</span>
          <span className="text-emerald-300 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {activeCount} Active
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* 4 Dedicated Cards: Total Referrals, Active Referrals, Pending Referrals, and Amount Collected */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Referrals */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 ${
            statusFilter === 'all'
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Referrals
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {totalReferralsCount}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-[11px] font-semibold text-slate-500">All Invites</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                100%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Referrals */}
        <div
          onClick={() => setStatusFilter('active')}
          className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-100'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800">
              Active Referrals
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {activeCount}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Qualified
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                Credited
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Referrals */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-100'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
              Pending Referrals
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {pendingCount}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                In Progress
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700">
                Action Req.
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Amount Collected */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl p-4 sm:p-5 border border-emerald-200/90 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
              Amount Collected
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-2xl lg:text-2xl font-black text-emerald-700 tracking-tight truncate">
              UGX {Number(amountCollected).toLocaleString()}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Wallet Balance
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Paid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History / Ledger Table */}
      <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Header with Status Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-950">
                Referral History & Reward Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time record of all users who joined via your referral link
              </p>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalReferralsCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Pending ({pendingCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredReferrals.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {statusFilter === 'active'
                ? 'No Active Referrals Found'
                : statusFilter === 'pending'
                ? 'No Pending Referrals'
                : 'No Referrals Recorded Yet'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              {statusFilter === 'active'
                ? 'When referred members activate, they will appear here.'
                : statusFilter === 'pending'
                ? 'All of your referred users are currently verified and active!'
                : 'Share your link with colleagues and friends. As soon as someone registers, their reward will automatically appear in this ledger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-5">Referred User</th>
                  <th className="py-3 px-4 sm:px-5">Date / Timestamp</th>
                  <th className="py-3 px-4 sm:px-5 text-center">Status</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Reward Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredReferrals.map((item, idx) => {
                  const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('en-UG', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) + ' • ' + dateObj.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })
                    : 'Recent';

                  const isCompleted =
                    item.status === 'COMPLETED' ||
                    item.status === 'qualified' ||
                    item.status === 'active';

                  const maskedUserId = item.referredUserId
                    ? item.referredUserId.length > 10
                      ? `${item.referredUserId.slice(0, 6)}...${item.referredUserId.slice(-4)}`
                      : item.referredUserId
                    : `@${item.username}`;

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Referred User */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {(item.username || item.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              @{item.username || 'user'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              ID: {maskedUserId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date / Timestamp */}
                      <td className="py-3.5 px-4 sm:px-5 text-slate-500 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Reward Status */}
                      <td className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold tracking-tight">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                            <span>Active / Credited</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold tracking-tight">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Activation</span>
                          </span>
                        )}
                      </td>

                      {/* Reward Earned */}
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <span className="font-black text-emerald-600 text-sm sm:text-base">
                          +UGX {Number(item.rewardAmount || 5000).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it Works / Benefits */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span>How Referral Crediting Operates</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center">
              1
            </span>
            <div className="text-xs font-bold text-slate-900 pt-1">Share Your Link</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Send your unique referral link to friends on WhatsApp, Telegram, or SMS.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center">
              2
            </span>
            <div className="text-xs font-bold text-slate-900 pt-1">Automatic Detection</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your friend lands with your code automatically filled and locked in their registration form.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center">
              3
            </span>
            <div className="text-xs font-bold text-slate-900 pt-1">Instant Ledger Credit</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The automated ledger credits UGX 5,000 to your balance right away with full tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
