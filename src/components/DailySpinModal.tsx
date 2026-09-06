import React, { useState } from 'react';
import { RotateCcw, X, Sparkles, Coins, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api.ts';
import { User, Wallet } from '../types.ts';
import { UgxCurrencyBadge } from './BrandAssets.tsx';

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onRewardWon: (rewardUgx: number, updatedWallet: Wallet) => void;
}

export const DailySpinModal: React.FC<DailySpinModalProps> = ({
  isOpen,
  onClose,
  user,
  onRewardWon
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isAccountActive = true;

  // Slices on wheel:
  // 6 slices: 300, 500, 800, 1200, 2000, 5000
  const slices = [
    { amount: 300, color: '#3B82F6', text: 'UGX 300' },
    { amount: 1200, color: '#10B981', text: 'UGX 1,200' },
    { amount: 500, color: '#F59E0B', text: 'UGX 500' },
    { amount: 2000, color: '#8B5CF6', text: 'UGX 2,000' },
    { amount: 800, color: '#EC4899', text: 'UGX 800' },
    { amount: 5000, color: '#EAB308', text: 'UGX 5,000' }
  ];

  const handleSpin = async () => {
    if (spinning) return;
    setErrorMessage('');
    setSpinning(true);
    setWonAmount(null);

    try {
      const res = await api.playSpin();
      const targetAmount = res.rewardUgx;

      // Find slice index
      let targetIndex = slices.findIndex(s => s.amount === targetAmount);
      if (targetIndex === -1) targetIndex = 0;

      // Calculate rotation: 6 slices = 60 degrees each
      const sliceAngle = 360 / slices.length;
      // Wheel arrow is at top (270 deg or 90 deg depending on orientation)
      // Extra spins (5 full rotations = 1800 deg)
      const baseRotation = rotation + 1800;
      const targetDeg = baseRotation + (360 - (targetIndex * sliceAngle + sliceAngle / 2));

      setRotation(targetDeg);

      setTimeout(() => {
        setSpinning(false);
        setWonAmount(targetAmount);

        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.5 }
          });
        } catch (e) {}

        onRewardWon(targetAmount, res.wallet);
      }, 3500);
    } catch (err: any) {
      setSpinning(false);
      setErrorMessage(err.message || 'Daily spin already claimed or unavailable');
    }
  };

  return (
    <div
      id="daily-spin-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 relative my-auto text-center"
      >
        {/* Top gradient header */}
        <div className="relative bg-gradient-to-b from-indigo-900 via-blue-900 to-blue-800 pt-7 pb-6 px-6 text-white overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Daily Member Bonus</span>
          </div>

          <h3 className="text-xl font-extrabold text-white">
            Lucky Wheel of Cash
          </h3>
          <p className="text-[11px] text-blue-200/90 mt-0.5">
            Spin once every 24 hours for guaranteed daily cash rewards
          </p>
        </div>

        {/* Wheel container */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Wheel Graphic */}
          <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
            {/* Top Indicator Arrow */}
            <div className="absolute top-0 z-30 transform -translate-y-1">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md" />
            </div>

            {/* Rotating SVG Wheel */}
            <div
              className="w-56 h-56 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden relative"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {slices.map((slice, i) => {
                  const startAngle = i * 60;
                  const endAngle = (i + 1) * 60;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);
                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Text angle
                  const textAngle = startAngle + 30;
                  const textRad = (textAngle * Math.PI) / 180;
                  const tx = 50 + 32 * Math.cos(textRad);
                  const ty = 50 + 32 * Math.sin(textRad);

                  return (
                    <g key={i}>
                      <path d={pathData} fill={slice.color} stroke="#ffffff" strokeWidth="0.8" />
                      <text
                        x={tx}
                        y={ty}
                        fill="#ffffff"
                        fontSize="4"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                      >
                        {slice.text}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Pin Button */}
            <div className="absolute z-20 w-14 h-14 rounded-full bg-slate-900 border-4 border-white shadow-lg flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          {wonAmount ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900"
            >
              <div className="text-xs font-semibold text-emerald-700">Congratulations!</div>
              <div className="text-xl font-black text-emerald-800 my-0.5">
                +UGX {Number(wonAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600">
                Credited directly to your Daily Earnings balance.
              </div>
            </motion.div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">
              Win between <span className="font-bold text-slate-800">UGX 300</span> to{' '}
              <span className="font-bold text-slate-800">UGX 5,000</span> instantly.
            </div>
          )}

          {/* Spin Trigger Button */}
          <div className="mt-4">
              <button
                id="spin-the-wheel-btn"
                onClick={handleSpin}
                disabled={spinning}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {spinning ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Spinning...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-300" />
                    <span>{wonAmount ? 'Spin Used For Today' : 'Spin Lucky Wheel'}</span>
                  </>
                )}
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
