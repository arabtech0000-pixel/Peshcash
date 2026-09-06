import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Tv,
  FileQuestion,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Task, Wallet } from '../types.ts';
import { api } from '../lib/api.ts';
import { UgxCurrencyBadge } from './BrandAssets.tsx';

import stanbicBanner from '../assets/images/stanbic_flexipay_banner_1788715760612.jpg';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onTaskCompleted: (task: Task, updatedWallet: Wallet) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onTaskCompleted
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Survey answers
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (task) {
      // Set timer based on task requirements
      const duration = task.timeEstimateSeconds || 20;
      setTimeLeft(duration);
      setTimerRunning(true);
      setCanClaim(false);
      setErrorMessage('');
      setSuccess(false);
      setSurveyAnswers({});
    }
  }, [task]);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  if (!task) return null;

  const handleClaimReward = async () => {
    // If survey, ensure all questions answered
    if (task.category === 'survey' && Array.isArray(task.surveyQuestions) && task.surveyQuestions.length > 0) {
      if (Object.keys(surveyAnswers).length < task.surveyQuestions.length) {
        setErrorMessage('Please answer all survey questions before claiming reward.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.completeTask(task.id, {
        answers: surveyAnswers,
        completedAt: new Date().toISOString()
      });

      setSuccess(true);
      try {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setTimeout(() => {
        onTaskCompleted(task, res.wallet);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to claim task reward');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 relative my-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#0e2766] to-[#153b8f] pt-6 pb-6 px-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold mb-2">
            <span className="uppercase tracking-wider">{task.category} Task</span>
          </div>

          <h3 className="text-xl font-extrabold text-white leading-snug">
            {task.title}
          </h3>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-300 font-extrabold text-base">
              <span>Reward:</span>
              <span>UGX {Number(task.rewardUgx ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.timeEstimateSeconds}s Est.</span>
            </div>
          </div>
        </div>

        {/* Task Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Task Completed!</h4>
              <p className="text-xs text-slate-500">
                +UGX {Number(task.rewardUgx ?? 0).toLocaleString()} has been credited to your Daily Earnings balance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Task specific media / viewer */}
              {task.category === 'video' && (
                <div className="rounded-2xl overflow-hidden bg-black relative aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
                  {task.mediaUrl ? (
                    <iframe
                      src={task.mediaUrl}
                      className="w-full h-full border-0 absolute inset-0 z-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={task.title}
                    />
                  ) : (
                    <div className="text-center p-4 z-10">
                      <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center mx-auto mb-2 shadow-lg animate-pulse">
                        <Play className="w-6 h-6 ml-0.5" />
                      </div>
                      <div className="text-xs font-bold text-white">Official Sponsor Video</div>
                      <div className="text-[11px] text-slate-400">Verifying watch engagement in real time</div>
                    </div>
                  )}
                  {/* Countdown overlay */}
                  <div className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md border border-white/10">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{timeLeft}s</span>
                  </div>
                </div>
              )}

              {task.category === 'ad' && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center border border-slate-200">
                  <img 
                    src={task.mediaUrl || stanbicBanner} 
                    alt={task.title}
                    className="w-full h-full object-cover absolute inset-0 z-0 opacity-80"
                  />
                  
                  <div className="z-10 text-center p-4 backdrop-blur-sm bg-black/40 rounded-xl border border-white/10 mx-4 shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white mx-auto flex items-center justify-center mb-2 shadow-lg">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-extrabold text-white">Partner Announcement</div>
                    <p className="text-xs text-blue-100 mt-1 max-w-[200px] mx-auto leading-tight">
                      Keep this sponsor display active while our anti-fraud verification monitors compliance.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 border border-blue-400 text-white text-xs font-bold font-mono shadow-md">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>{timeLeft}s Remaining</span>
                    </div>
                  </div>
                </div>
              )}

              {(task.category === 'survey' || task.category === 'special') && task.surveyQuestions && (
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {task.surveyQuestions.map((sq, qIdx) => (
                    <div key={qIdx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-900 mb-2">
                        {qIdx + 1}. {sq.question}
                      </div>
                      <div className="space-y-1.5">
                        {sq.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              surveyAnswers[qIdx] === opt
                                ? 'bg-blue-100/70 border border-blue-400 font-semibold text-blue-900'
                                : 'hover:bg-slate-100 border border-transparent text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`survey_q_${qIdx}`}
                              value={opt}
                              checked={surveyAnswers[qIdx] === opt}
                              onChange={() =>
                                setSurveyAnswers((prev) => ({ ...prev, [qIdx]: opt }))
                              }
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Requirement & Disclaimer */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="font-semibold text-slate-700">Requirement: </span>
                {task.requirements}
              </div>

              {/* Action Button */}
              <div>
                <button
                  id="claim-task-reward-btn"
                  onClick={handleClaimReward}
                  disabled={submitting || (task.category !== 'survey' && !canClaim)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 ${
                    canClaim || task.category === 'survey'
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white shadow-blue-700/20 active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : canClaim || task.category === 'survey' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Claim UGX {Number(task.rewardUgx ?? 0).toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Wait {timeLeft}s to Verify & Claim</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
