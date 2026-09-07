import React, { useState } from 'react';
import {
  ArrowDownToLine,
  TrendingUp,
  RotateCcw,
  Users,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Wallet, User } from '../types.ts';
import { UgxCurrencyBadge } from './BrandAssets.tsx';

interface BalanceCardProps {
  wallet: Wallet | null;
  user: User | null;
  onOpenWithdraw: () => void;
  onOpenSpin: () => void;
  onOpenReferrals: () => void;
  onOpenActivation: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  wallet,
  user,
  onOpenWithdraw,
  onOpenSpin,
  onOpenReferrals,
  onOpenActivation
}) => {
  const [tab, setTab] = useState<'available' | 'breakdown'>('available');
  const isAccountActive = user?.status === 'active';

  const available = wallet?.availableBalance || 0;
  const daily = wallet?.dailyEarningsBalance || 0;
  const referral = wallet?.referralEarningsBalance || 0;
  const bonus = wallet?.bonusBalance || 0;
  const pending = wallet?.pendingWithdrawalsBalance || 0;
  const total = wallet?.totalEarnings || (daily + referral + bonus);

  return (
    <div
      id="pesa-balance-card"
      className="relative -mt-8 mx-4 sm:mx-6 bg-white rounded-[28px] shadow-[0_10px_30px_rgba(15,35,90,0.08)] border border-slate-100 p-5 sm:p-6 z-20"
    >
      {/* Segmented Pill Tabs matching reference screenshot */}
      <div className="flex bg-slate-100/90 p-1 rounded-full mb-4 max-w-xs mx-auto">
        <button
          id="balance-tab-overview"
          onClick={() => setTab('available')}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 ${
            tab === 'available'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Available Balance
        </button>
        <button
          id="balance-tab-breakdown"
          onClick={() => setTab('breakdown')}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 ${
            tab === 'breakdown'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Earnings Breakdown
        </button>
      </div>

      {tab === 'available' ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ready for Mobile Money Payout
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Verified Active
            </span>
          </div>

          {/* Primary Available Balance typography */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-blue-800">UGX</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {Number(available ?? 0).toLocaleString()}
            </span>
          </div>

          {/* New Account Bonus Banner (if any) */}
          {bonus > 0 && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎁</span>
                <span className="font-semibold text-amber-900 text-[11px]">Welcome Bonus:</span>
                <span className="font-extrabold text-amber-900 text-xs">UGX {Number(bonus).toLocaleString()}</span>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200/60">
                Active
              </span>
            </div>
          )}

          {/* Sub-metric chips */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-2.5">
              <span className="text-[11px] font-medium text-slate-500 block">
                Daily Task Earnings
              </span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                <UgxCurrencyBadge amount={daily} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-2.5">
              <span className="text-[11px] font-medium text-slate-500 block">
                Referral Commissions
              </span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                <UgxCurrencyBadge amount={referral} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Breakdown view */
        <div className="space-y-2.5 py-1">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Total Account Value</div>
                <div className="text-[10px] text-slate-500">Tasks + referrals balance</div>
              </div>
            </div>
            <UgxCurrencyBadge amount={total} className="text-sm font-black text-blue-900" />
          </div>

          {bonus > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  🎁
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">New Account Bonus</div>
                  <div className="text-[10px] text-amber-700">Welcome bonus reward</div>
                </div>
              </div>
              <UgxCurrencyBadge amount={bonus} className="text-sm font-bold text-amber-800" />
            </div>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Referral Wallet (Separate)</div>
                <div className="text-[10px] text-slate-500">UGX 5,000 per qualified referee</div>
              </div>
            </div>
            <UgxCurrencyBadge amount={referral} className="text-sm font-bold text-slate-800" />
          </div>

          {pending > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">Pending Withdrawals</div>
                  <div className="text-[10px] text-amber-700">Held securely in processing</div>
                </div>
              </div>
              <UgxCurrencyBadge amount={pending} className="text-sm font-bold text-amber-900" />
            </div>
          )}
        </div>
      )}

      {/* Main Action Button in deep royal blue matching reference */}
      <div className="mt-4">
        {!isAccountActive ? (
          <button
            onClick={onOpenActivation}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Activate Account to Withdraw</span>
          </button>
        ) : (
          <button
            id="balance-card-withdraw-btn"
            onClick={onOpenWithdraw}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-blue-800/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Withdraw to Mobile Money</span>
          </button>
        )}
      </div>

      {/* Quick Action Pills */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          id="balance-quick-spin-btn"
          onClick={() => {
            if (!isAccountActive) {
              onOpenActivation();
              return;
            }
            onOpenSpin();
          }}
          className="py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
          <span>Daily Spin Wheel</span>
        </button>

        <button
          id="balance-quick-invite-btn"
          onClick={onOpenReferrals}
          className="py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Invite & Earn 5,000</span>
        </button>
      </div>
    </div>
  );
};
