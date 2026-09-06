import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Clock,
  PlayCircle,
  Tv,
  FileQuestion,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Task, User } from '../../types.ts';
import { UgxCurrencyBadge } from '../BrandAssets.tsx';

import taskVideoCover from '../../assets/images/task_video_cover_1788714412730.jpg';
import taskSurveyCover from '../../assets/images/task_survey_cover_1788714427112.jpg';
import taskAdCover from '../../assets/images/task_ad_cover_1788714442821.jpg';
import spinWheelCover from '../../assets/images/spin_wheel_cover_1788714457851.jpg';

interface TasksViewProps {
  tasks: Task[];
  user: User | null;
  onStartTask: (task: Task) => void;
  onOpenSpin: () => void;
  onOpenActivation: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  user,
  onStartTask,
  onOpenSpin,
  onOpenActivation
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAccountActive = user?.status === 'active';

  const categories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'video', label: 'Videos' },
    { id: 'ad', label: 'Partner Ads' },
    { id: 'survey', label: 'Surveys' },
    { id: 'spin', label: 'Spins' },
    { id: 'special', label: 'Agency Quiz' }
  ];

  const filteredTasks = (tasks || []).filter((task) => {
    if (!task.isActive) return false;
    const matchesCat = activeCategory === 'all' || task.category === activeCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <img src={taskVideoCover} alt="Video Task" className="w-full h-full object-cover" />;
      case 'ad':
        return <img src={taskAdCover} alt="Ad Task" className="w-full h-full object-cover" />;
      case 'survey':
        return <img src={taskSurveyCover} alt="Survey Task" className="w-full h-full object-cover" />;
      case 'spin':
        return <img src={spinWheelCover} alt="Spin Task" className="w-full h-full object-cover" />;
      default:
        return <img src={taskVideoCover} alt="Task" className="w-full h-full object-cover" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Earnings Tasks
        </h2>
        <p className="text-xs text-slate-500">
          Complete verified activities to earn daily Ugandan Shilling rewards
        </p>
      </div>

      {/* Account Inactive Alert Banner */}
      {!isAccountActive && (
        <div className="p-4 rounded-[24px] bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Pending Activation Required
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Pay the one-time UGX 10,000 fee via MTN/Airtel to unlock instant reward claims.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenActivation}
            className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            Activate Now
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search available tasks by title or keyword..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid / List */}
      <div className="space-y-3 pt-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No tasks found in this category</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
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
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide shrink-0">
                        {task.category}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                        <Clock className="w-3 h-3" />
                        {task.timeEstimateSeconds}s
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug break-words">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 break-words">
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
                  Available daily:{' '}
                  <span className="font-bold text-slate-800">{task.remainingToday}</span> left
                </span>

                {task.category === 'spin' ? (
                  <button
                    onClick={onOpenSpin}
                    className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Spin Wheel</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAccountActive) {
                        onOpenActivation();
                      } else {
                        onStartTask(task);
                      }
                    }}
                    disabled={task.remainingToday === 0}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      task.remainingToday > 0
                        ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {task.remainingToday > 0 ? 'Start Task' : 'Completed Today'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
