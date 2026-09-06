import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  Users,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Wallet, User, TransactionHistoryItem } from '../../types.ts';
import { UgxCurrencyBadge, MTNMoMoAppIcon, AirtelMoneyAppIcon } from '../BrandAssets.tsx';

interface WalletViewProps {
  wallet: Wallet | null;
  user: User | null;
  transactions: TransactionHistoryItem[];
  onOpenWithdraw: () => void;
  onOpenActivation: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  wallet,
  user,
  transactions,
  onOpenWithdraw,
  onOpenActivation
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchRef, setSearchRef] = useState('');

  const isAccountActive = user?.status === 'active';
  const available = wallet?.availableBalance || 0;
  const bonus = wallet?.bonusBalance ?? 1000;
  const total = wallet?.totalEarnings || (available + bonus);
  const daily = wallet?.dailyEarningsBalance || 0;
  const referral = wallet?.referralEarningsBalance || 0;
  const pending = wallet?.pendingWithdrawalsBalance || 0;

  const filters = [
    { id: 'all', label: 'All Transactions' },
    { id: 'task_earning', label: 'Task Earnings' },
    { id: 'referral_earning', label: 'Referral Rewards' },
    { id: 'bonus', label: 'Welcome Bonus' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'activation_fee', label: 'Activation Fee' }
  ];

  const filteredTransactions = (transactions || []).filter((tx) => {
    const txCategory = tx.category || '';
    const txType = tx.type || '';
    const matchesType =
      filterType === 'all' ||
      txType === filterType ||
      txCategory === filterType ||
      (filterType === 'task_earning' && (txCategory === 'daily_earnings' || txCategory === 'task_earning')) ||
      (filterType === 'referral_earning' && (txCategory === 'referral_earnings' || txCategory === 'referral_earning')) ||
      (filterType === 'bonus' && (txCategory === 'bonus' || txCategory === 'deposits')) ||
      (filterType === 'withdrawal' && (txCategory === 'withdrawals' || txCategory === 'withdrawal')) ||
      (filterType === 'activation_fee' && txCategory === 'activation_fee');

    const refStr = ((tx as any).referenceId || tx.transactionId || tx.id || '').toString().toLowerCase();
    const descStr = (tx.description || tx.title || '').toString().toLowerCase();
    const searchLower = (searchRef || '').toLowerCase();
    const matchesSearch = !searchLower || refStr.includes(searchLower) || descStr.includes(searchLower);
    return matchesType && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Completed
          </span>
        );
      case 'pending':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-2.5 h-2.5" />
            {status === 'processing' ? 'Processing' : 'Pending'}
          </span>
        );
      case 'failed':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <XCircle className="w-2.5 h-2.5" />
            {status === 'rejected' ? 'Rejected' : 'Failed'}
          </span>
        );
      default:
        return null;
    }
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
      case 'activation_fee':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'bonus':
        return <span className="text-base leading-none">🎁</span>;
      case 'task_earning':
        return <ArrowDownLeft className="w-4 h-4 text-blue-600" />;
      case 'referral_earning':
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-UG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-5">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Wallet & Payouts
        </h2>
        <p className="text-xs text-slate-500">
          Mobile Money balances, accounting breakdown, and ledger history
        </p>
      </div>

      {/* Main Balance Box */}
      <div className="bg-gradient-to-br from-[#0a1e4a] via-[#0f2d70] to-[#153b8f] rounded-[30px] p-6 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
            Available for Mobile Money Payout
          </span>
          {isAccountActive ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              Active
            </span>
          ) : (
            <button
              onClick={onOpenActivation}
              className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30"
            >
              Pending Activation
            </button>
          )}
        </div>

        <div className="relative z-10 mt-2 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-blue-300">UGX</span>
          <span className="text-4xl font-black text-white tracking-tight">
            {Number(available ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Welcome Bonus Banner */}
        <div className="relative z-10 mt-3 p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between text-xs text-blue-100">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🎁</span>
            <span className="font-semibold text-white">Welcome Bonus:</span>
            <span className="font-extrabold text-amber-300">UGX {Number(bonus).toLocaleString()}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
            Credited
          </span>
        </div>

        {/* Breakdown sub-cards */}
        <div className="relative z-10 grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5">
            <span className="text-[11px] text-blue-200 block">Daily Task Earnings</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              UGX {Number(daily ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5">
            <span className="text-[11px] text-blue-200 block">Referral Commissions</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              UGX {Number(referral ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {pending > 0 && (
          <div className="relative z-10 mt-2 p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-between text-xs text-amber-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Processing:
            </span>
            <span className="font-bold">UGX {Number(pending ?? 0).toLocaleString()}</span>
          </div>
        )}

        <div className="relative z-10 mt-4">
          {isAccountActive ? (
            <button
              id="wallet-view-withdraw-btn"
              onClick={onOpenWithdraw}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm shadow-md flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-blue-800 shrink-0" />
                <span>Withdraw to Mobile Money</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <MTNMoMoAppIcon className="w-5 h-5" />
                <AirtelMoneyAppIcon className="w-5 h-5" />
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenActivation}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <span>Activate Account (UGX 10,000)</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Transaction Ledger
          </h3>
          <span className="text-xs text-slate-400">
            {filteredTransactions.length} records
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search by Reference */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Filter by ref ID (e.g. TX-..., WTH-...)"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5 pt-1">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No transactions matching your filter</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'withdrawal' || tx.type === 'activation_fee'
                        ? 'bg-red-50 text-red-600'
                        : tx.type === 'referral_earning'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {getTxIcon(tx.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {tx.description}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="text-[10px] text-slate-400 shrink-0">{formatDate(tx.createdAt)}</span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        • {(tx as any).referenceId || tx.transactionId || tx.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-black ${
                      tx.type === 'withdrawal' || tx.type === 'activation_fee'
                        ? 'text-red-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {tx.type === 'withdrawal' || tx.type === 'activation_fee' ? '-' : '+'}
                    UGX {Number(tx.amountUgx ?? (tx as any).amount ?? 0).toLocaleString()}
                  </div>
                  <div className="mt-1">{getStatusBadge(tx.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
