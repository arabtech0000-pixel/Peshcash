import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { User, Wallet } from '../types.ts';
import { api } from '../lib/api.ts';

interface ActivationModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onActivated: (user: User, wallet: Wallet) => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, user, onClose, onActivated }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'initial' | 'waiting'>('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setPhoneNumber(user.phone || '');
      setStep('initial');
      setError('');
      setMessage('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleTrigger = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.triggerActivation(phoneNumber);
      if (res.success) {
        setStep('waiting');
        setMessage(res.message || 'Payment prompt sent to your phone. Please complete the payment.');
      } else {
        setError(res.message || 'Failed to trigger activation payment');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.checkActivationStatus();
      if (res.success) {
        // Fetch latest user data and wallet to pass back
        const [meRes, walletRes] = await Promise.all([
          api.me(),
          api.getWallet()
        ]);
        onActivated(meRes.user, walletRes.wallet);
        onClose();
      } else {
        setError(res.message || 'Payment not yet confirmed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10"
        >
          <div className="bg-amber-500 p-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-amber-900 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Account Activation</h2>
            <p className="text-amber-100 text-sm mt-1">One-time UGX 10,000 fee</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}
            
            {message && step === 'waiting' && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">{message}</p>
              </div>
            )}

            {step === 'initial' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Money Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0770000000"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleTrigger}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-extrabold text-sm shadow-md hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay UGX 10,000 Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 mt-4">
                    Waiting for you to complete the payment on your phone...
                  </p>
                </div>
                <button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      I Have Paid — Check Status
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep('initial')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel or change number
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
