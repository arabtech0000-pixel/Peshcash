import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  ChevronRight,
  PlayCircle,
  Tv,
  FileQuestion,
  ShieldCheck,
  Users,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Info,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Wallet, Task } from '../../types.ts';
import { BalanceCard } from '../BalanceCard.tsx';
import { UgxCurrencyBadge } from '../BrandAssets.tsx';

import taskVideoCover from '../../assets/images/task_video_cover_1788714412730.jpg';
import taskSurveyCover from '../../assets/images/task_survey_cover_1788714427112.jpg';
import taskAdCover from '../../assets/images/task_ad_cover_1788714442821.jpg';
import spinWheelCover from '../../assets/images/spin_wheel_cover_1788714457851.jpg';

interface HomeViewProps {
  user: User | null;
  wallet: Wallet | null;
  tasks: Task[];
  onOpenWithdraw: () => void;
  onOpenSpin: () => void;
  onOpenReferrals: () => void;
  onOpenActivation: () => void;
  onStartTask: (task: Task) => void;
  onViewAllTasks: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  wallet,
  tasks,
  onOpenWithdraw,
  onOpenSpin,
  onOpenReferrals,
  onOpenActivation,
  onStartTask,
  onViewAllTasks
}) => {
  const [copied, setCopied] = useState(false);
  const isAccountActive = user?.status === 'active';

  const handleCopyReferral = () => {
    if (!user || user.status !== 'active') {
      onOpenActivation();
      return;
    }
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <img src={taskVideoCover} alt="Video Task" className="w-full h-full object-cover" />;
      case 'ad':
        return <img src={taskAdCover} alt="Ad Task" className="w-full h-full object-cover" />;
      case 'survey':
        return <img src={taskSurveyCover} alt="Survey Task" className="w-full h-full object-cover" />;
      default:
        return <img src={taskVideoCover} alt="Task" className="w-full h-full object-cover" />;
    }
  };

  const activeTasks = (tasks || []).filter((t) => t.isActive);

  return (
    <div className="pb-28 space-y-5">
      {/* Primary Balance Card (Overlapping Top Banner) */}
      <BalanceCard
        wallet={wallet}
        user={user}
        onOpenWithdraw={onOpenWithdraw}
        onOpenSpin={onOpenSpin}
        onOpenReferrals={onOpenReferrals}
        onOpenActivation={onOpenActivation}
      />

      {/* Amber/Dark Highlight Card matching reference screenshot 1 */}
      <div className="px-4 sm:px-6">
        <div
          onClick={onOpenSpin}
          className="cursor-pointer relative overflow-hidden rounded-[24px] bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white shadow-md flex items-center justify-between group transition-all duration-200 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0 overflow-hidden">
              <img src={spinWheelCover} alt="Spin Wheel" className="w-full h-full object-cover group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
                  Daily Reward
                </span>
                <span className="text-[10px] text-slate-400">Guaranteed Win</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Spin the Lucky Cash Wheel
              </h4>
              <p className="text-[11px] text-slate-300">
                Win between UGX 300 to UGX 5,000 every 24 hours
              </p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/20 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Daily Tasks Section (Kept fully separate from referrals) */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Daily Earnings Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Sponsored videos, partner ads, and market research surveys
            </p>
          </div>
          <button
            onClick={onViewAllTasks}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {activeTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-[0_4px_20px_rgba(15,35,90,0.04)] hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative">
                    {getTaskIcon(task.category)}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <PlayCircle className="w-6 h-6 text-white transform scale-50 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide shrink-0">
                        {task.category}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                        <Clock className="w-3 h-3" />
                        {task.timeEstimateSeconds}s
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 break-words">
                      {task.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium text-slate-400 block">Reward</span>
                  <div className="text-sm font-black text-blue-800">
                    <UgxCurrencyBadge amount={task.rewardUgx} />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Remaining today:{' '}
                  <span className="font-bold text-slate-800">{task.remainingToday}</span>
                </span>

                <button
                  id={`start-task-btn-${task.id}`}
                  onClick={() => onStartTask(task)}
                  disabled={task.remainingToday === 0}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    task.remainingToday > 0
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {task.remainingToday > 0 ? 'Complete Task' : 'Completed'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Agency Snapshot (Kept separate from daily earnings) */}
      <div className="px-4 sm:px-6">
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-[28px] p-5 border border-blue-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-blue-950">
                  Referral Agency Commissions
                </h3>
                <span className="text-[11px] text-blue-700">Separate Wallet & Payout Stream</span>
              </div>
            </div>
            <button
              onClick={onOpenReferrals}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Earn <span className="font-bold text-slate-900">UGX 5,000</span> for every friend who registers with your personal referral link. Instant crediting to your account.
          </p>

          <div className="bg-white rounded-2xl p-3 border border-blue-200/80 flex items-center justify-between gap-2 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Your Referral Code
              </span>
              <span className="text-base font-black text-blue-900 tracking-wider font-mono">
                {user?.status === 'active' ? (user?.referralCode || '...') : 'LOCKED'}
              </span>
            </div>
            <button
              onClick={handleCopyReferral}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                user?.status === 'active' 
                  ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{user?.status === 'active' ? 'Copy Code' : 'Activate to Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer Notice */}
      <div className="px-4 sm:px-6">
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/70 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-normal">
            <span className="font-bold text-slate-800">Transparency Guarantee:</span> Pesa Cash is an authentic advertising rewards & agency platform. Rewards are funded exclusively by verified sponsor impressions and tasks. Never represented as guaranteed investment returns.
          </p>
        </div>
      </div>
    </div>
  );
};
